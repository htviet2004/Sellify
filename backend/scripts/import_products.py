"""Import products from curated CSV (selected_30_per_category.csv).

CSV columns expected (examples):
id,keyword_source,name,description,price,stock,image,image_url,product_link,category,color_options,size_options

Paths:
- Default CSV: shopee crawl/Dataset/products_selected/selected_30_per_category.csv
- Local image paths inside CSV are joined relative to that dataset root.

Usage (safe):
  Set-Location -Path "C:\VIET\PBL6\main\backend"; \
  .\.venv\Scripts\python.exe -c "import os, django; os.environ.setdefault('DJANGO_SETTINGS_MODULE','backend.settings'); django.setup(); from scripts.import_products import run; run()"

Notes:
- Ensures seller users exist (seller1/2/3) or creates them with dummy password.
- Does not delete existing data.
- You can pass a custom CSV path: run(csv_path="/path/to/file.csv")
"""

import csv
from pathlib import Path
from typing import Iterable, List

from django.contrib.auth import get_user_model
from django.core.files import File
from products.models import Category, Product

User = get_user_model()


def _ensure_sellers(usernames: Iterable[str]) -> List[User]:
    sellers = []
    for uname in usernames:
        user, _created = User.objects.get_or_create(
            username=uname,
            defaults={"email": f"{uname}@example.com", "password": "pbkdf2_sha256$notset"},
        )
        sellers.append(user)
    return sellers


def _parse_list_field(raw: str | None) -> list[str]:
    if not raw:
        return []
    # Split by comma and strip; keep single value as list
    parts = [p.strip() for p in raw.split(',') if p.strip()]
    return parts if parts else ([raw.strip()] if raw.strip() else [])


def _resolve_image_path(image_field: str, dataset_root: Path, base_dir: Path) -> Path | None:
    """Resolve image path from CSV to an existing local file.

    - Absolute path: use directly.
    - Starts with "Dataset/": join with dataset_root (which already points to the folder containing Dataset).
    - Otherwise: join with base_dir (Dataset/).
    """
    if not image_field:
        return None

    p = Path(image_field)
    if p.is_absolute():
        candidate = p
    elif p.parts and p.parts[0].lower() == "dataset":
        candidate = dataset_root / p  # keep the leading Dataset segment
    else:
        candidate = base_dir / p

    candidate = candidate.resolve()
    return candidate if candidate.exists() else None


def run(csv_path: str | None = None, limit: int | None = None):
    # Resolve CSV path
    dataset_root = Path(r"C:\VIET\PBL6\shopee crawl")
    default_csv = dataset_root / "Dataset" / "products_selected" / "selected_30_per_category.csv"
    products_csv = Path(csv_path) if csv_path else default_csv

    if not products_csv.exists():
        print(f"❌ Không tìm thấy file: {products_csv}")
        return

    # Prepare sellers
    seller_usernames = ["seller1", "seller2", "seller3"]
    sellers = _ensure_sellers(seller_usernames)
    if not sellers:
        print("❌ Không có seller khả dụng")
        return
    print(f"✅ Seller dùng để gán: {', '.join(u.username for u in sellers)}")

    # Cache categories
    category_cache: dict[str, Category] = {}

    processed = 0
    created = 0
    local_images = 0
    remote_images = 0
    missing_images = 0

    # Base directory for relative image paths in CSV
    base_dir = products_csv.parent.parent  # points to Dataset/

    print(f"🔄 Đang đọc file {products_csv}...")
    with products_csv.open(newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        rows = list(reader)
        if limit is not None:
            rows = rows[:limit]

        for row in rows:
            processed += 1
            name = row.get("name") or "Unknown Product"
            description = row.get("description") or ""
            price_raw = row.get("price") or "0"
            stock_raw = row.get("stock") or "0"
            category_name = row.get("category") or "Uncategorized"

            # Category
            cat = category_cache.get(category_name)
            if not cat:
                cat, _ = Category.objects.get_or_create(name=category_name, defaults={"is_active": True})
                category_cache[category_name] = cat

            # Seller round-robin
            seller = sellers[(processed - 1) % len(sellers)]

            # Image handling
            image_field = row.get("image") or ""
            image_url = (row.get("image_url") or "").strip()
            local_path = _resolve_image_path(image_field, dataset_root, base_dir)

            color_opts = _parse_list_field(row.get("color_options")) or []
            size_opts = _parse_list_field(row.get("size_options")) or []

            try:
                price = int(float(price_raw))
            except ValueError:
                price = 0
            if price <= 0:
                price = 1000  # tối thiểu 1k để pass validation

            try:
                stock = int(float(stock_raw))
            except ValueError:
                stock = 0

            product = Product(
                seller=seller,
                category=cat,
                name=name,
                description=description,
                price=price,
                stock=max(stock, 0),
                is_active=True,
                color_options=color_opts,
                size_options=size_opts,
                image_url=image_url if not local_path else "",
            )

            if local_path:
                product.save()
                with local_path.open("rb") as f:
                    product.image.save(local_path.name, File(f), save=True)
                local_images += 1
            else:
                product.save()
                if image_url:
                    remote_images += 1
                else:
                    missing_images += 1

            created += 1

            if processed % 50 == 0:
                print(f"  📦 Đã xử lý {processed} sản phẩm...")

    print("✅ Import hoàn tất!")
    print(f"📊 Processed: {processed}, Created: {created}")
    print(f"🖼️  Ảnh local: {local_images}")
    print(f"🌐  Ảnh URL: {remote_images}")
    print(f"❌ Thiếu ảnh: {missing_images}")
    print(f"📂 Categories: {len(category_cache)}")


if __name__ == "__main__":
    run()
