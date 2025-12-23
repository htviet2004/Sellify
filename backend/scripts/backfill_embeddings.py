"""Backfill CLIP image embeddings for products.

Usage:
    python manage.py shell -c "from scripts import backfill_embeddings; backfill_embeddings.run()"

Behavior:
    - Walk through active products (optionally only missing embeddings)
    - Load image file if available; else skip
    - Compute CLIP embedding and save to product.image_embedding
    - Prints progress and totals
"""
from pathlib import Path

import torch
from django.db import transaction
from PIL import Image

from clip_service import get_image_embedding
from products.models import Product


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
        img_path = None
        try:
            if p.image and p.image.name:
                img_path = Path(p.image.path)
            else:
                # Nếu không có file local thì bỏ qua (không xử lý image_url ở đây)
                skipped += 1
                continue

            if not img_path.exists():
                skipped += 1
                continue

            with Image.open(img_path).convert("RGB") as im:
                emb = get_image_embedding(im)
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
