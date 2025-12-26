"""Backfill CLIP image embeddings for products.

Usage:
    python manage.py shell -c "from scripts import backfill_embeddings; backfill_embeddings.run()"

Behavior:
    - Walk through active products (optionally only missing embeddings)
    - Load local image if available; otherwise try downloading from image_url
    - Compute CLIP embedding and save to product.image_embedding
    - Prints progress and totals
"""
from pathlib import Path
from io import BytesIO

import requests
import torch
from django.db import transaction
from PIL import Image

from clip_service import get_image_embedding
from products.models import Product


def _open_image(product: Product):
    """Open PIL image from local file if exists else from image_url. Return Image or None."""
    # Local file first
    if product.image and product.image.name:
        img_path = Path(product.image.path)
        if img_path.exists():
            return Image.open(img_path).convert("RGB")

    # Fallback: download from image_url
    url = (product.image_url or "").strip()
    if not url:
        return None

    try:
        resp = requests.get(url, timeout=8)
        if resp.status_code != 200:
            return None
        return Image.open(BytesIO(resp.content)).convert("RGB")
    except Exception:
        return None


def run(only_missing: bool = True, batch_size: int = 100):
    qs = Product.objects.filter(is_active=True)
    if only_missing:
        qs = qs.filter(image_embedding__isnull=True)

    total = qs.count()
    if total == 0:
        print("✅ Không có sản phẩm cần backfill.")
        return

    print(f"🔄 Backfill embeddings cho {total} sản phẩm (only_missing={only_missing})")

    processed = 0
    updated = 0
    skipped = 0
    errors = 0

    def save_batch(batch):
        if not batch:
            return
        with transaction.atomic():
            for p in batch:
                p.save(update_fields=["image_embedding"])

    batch = []

    for p in qs.iterator():
        processed += 1
        try:
            img = _open_image(p)
            if img is None:
                skipped += 1
                continue

            emb = get_image_embedding(img)
            p.image_embedding = emb
            batch.append(p)
            updated += 1

            if len(batch) >= batch_size:
                save_batch(batch)
                batch.clear()

        except Exception as e:
            errors += 1
            print(f"❌ Lỗi sản phẩm {p.id}: {e}")
            continue

        if processed % 100 == 0:
            print(f"  📦 Đã xử lý {processed}/{total} (updated={updated}, skipped={skipped}, errors={errors})")

    # save remaining
    save_batch(batch)

    print("✅ Hoàn tất backfill")
    print(f"📊 Processed: {processed}, Updated: {updated}, Skipped: {skipped}, Errors: {errors}")

# Auto-run when loaded via Get-Content | python manage.py shell
run(only_missing=False, batch_size=100)
