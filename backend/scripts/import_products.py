import csv
import random
from pathlib import Path
from products.models import Product, Category
from django.contrib.auth import get_user_model
from django.core.files import File

User = get_user_model()

def run():
    base_dir = Path(__file__).resolve().parent
    products_csv = base_dir / 'styles.csv'
    images_csv = base_dir / 'images.csv'
    image_dir = Path(r"C:\Users\HOan\Downloads\fashion-dataset\images")

    if not products_csv.exists():
        print(f"❌ Không tìm thấy file: {products_csv}")
        return

    def normalize_filename(name: str | None) -> str | None:
        if not name:
            return None
        return name.strip().lower()

    def find_local_image(row_id: str | None) -> Path | None:
        if not row_id:
            return None
        for ext in ('.jpg', '.jpeg', '.png', '.webp'):
            p = image_dir / f"{row_id}{ext}"
            if p.exists():
                return p
        return None

    # Load image map
    image_map: dict[str, str] = {}
    if images_csv.exists():
        with images_csv.open(newline='', encoding='utf-8') as imgfile:
            reader = csv.DictReader(imgfile)
            for row in reader:
                fn = (
                    row.get('filename')
                    or row.get('file_name')
                    or row.get('image')
                    or row.get('image_filename')
                )
                url = row.get('link') or row.get('url') or row.get('image_url')
                fn_n = normalize_filename(fn)
                if fn_n and url:
                    image_map[fn_n] = url.strip()
        print(f"✅ Đã load {len(image_map)} ảnh từ images.csv")
    else:
        print(f"⚠️ Không tìm thấy images.csv tại: {images_csv}. Sẽ import không có ảnh URL.")

    if not image_dir.exists():
        print(f"⚠️ Thư mục ảnh local chưa tồn tại: {image_dir}")

    # Seller random
    seller_usernames = ['seller1', 'seller2', 'seller3']
    sellers = list(User.objects.filter(username__in=seller_usernames))
    if not sellers:
        print("❌ Không tìm thấy seller nào trong database! Tạo seller1, seller2, seller3 trước.")
        return
    print(f"✅ Seller sử dụng sẽ random trong: {', '.join([u.username for u in sellers])}")

    # Cache categories
    category_cache = {}

    remote_products: list[Product] = []
    missing_any_image = 0
    have_local = 0
    have_remote = 0

    processed = 0
    MAX_ROWS = 20

    COLORS = [
        'Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 
        'Pink', 'Gray', 'Purple', 'Orange', 'Brown', 'Beige', 
        'Turquoise', 'Navy', 'Olive'
    ]
    SIZES = ['S', 'M', 'L', 'XL', 'XXL']

    print(f"🔄 Đang đọc file {products_csv}...")

    with products_csv.open(newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        all_rows = list(reader)
        sample_rows = random.sample(all_rows, k=min(MAX_ROWS, len(all_rows)))  # random 2000 dòng

        for row in sample_rows:
            name = row.get('productDisplayName') or row.get('name') or 'Unknown Product'
            desc_parts = []
            for key in ['gender', 'usage', 'articleType', 'baseColour', 'season', 'year']:
                val = (row.get(key) or '').strip()
                if val:
                    desc_parts.append(val)
            description = ' - '.join(desc_parts) if desc_parts else 'No description'

            category_name = row.get('subCategory') or row.get('masterCategory') or 'Uncategorized'
            if category_name not in category_cache:
                category_obj, created = Category.objects.get_or_create(
                    name=category_name,
                    defaults={'is_active': True}
                )
                category_cache[category_name] = category_obj
                if created:
                    print(f"  ➕ Tạo category mới: {category_name}")
            else:
                category_obj = category_cache[category_name]

            row_id = row.get('id') or row.get('productId') or row.get('styleid') or row.get('product_id')
            local_path = find_local_image(str(row_id) if row_id else None)

            image_url = ""
            if not local_path:
                filename = row.get('filename') or row.get('file_name')
                if not filename and row_id:
                    filename = f"{row_id}.jpg"
                fn_norm = normalize_filename(filename)
                if fn_norm and image_map:
                    image_url = image_map.get(fn_norm, "")
                    if not image_url and '.' in fn_norm:
                        image_url = image_map.get(fn_norm.rsplit('.', 1)[0], "")

            # Random giá từ 100k → 5 triệu, làm tròn 1000
            price = random.randint(100_000, 5_000_000)
            price = (price // 1000) * 1000

            stock = random.randint(1, 50)
            rating = round(random.uniform(1.0, 5.0), 1)
            sold_count = random.randint(0, 500)
            seller = random.choice(sellers)

            variant_colors = random.sample(COLORS, k=random.randint(1, min(len(COLORS), 6)))
            variant_sizes = random.sample(SIZES, k=random.randint(1, min(len(SIZES), 5)))
            variants_str = f"Colors: {', '.join(variant_colors)} | Sizes: {', '.join(variant_sizes)}"

            desc_with_stats = f"{description}\nRating: {rating}⭐ | Sold: {sold_count}\n{variants_str}"

            product_data = {
                'seller': seller,
                'category': category_obj,
                'name': name,
                'description': desc_with_stats,
                'price': price,
                'stock': stock,
                'is_active': True,
                'color_options': variant_colors,
                'size_options': variant_sizes,
            }

            if local_path:
                product = Product(**product_data, image_url="")
                product.save()
                with local_path.open('rb') as f:
                    product.image.save(local_path.name, File(f), save=True)
                have_local += 1
                processed += 1
            else:
                if not image_url:
                    missing_any_image += 1
                product = Product(**product_data, image='', image_url=image_url)
                remote_products.append(product)
                have_remote += 1
                processed += 1

            if processed % 100 == 0:
                print(f"  📦 Đã xử lý {processed}/{MAX_ROWS} sản phẩm...")

    if remote_products:
        try:
            print(f"\n💾 Đang lưu {len(remote_products)} sản phẩm dùng URL ảnh...")
            Product.objects.bulk_create(remote_products, batch_size=500)
        except Exception as e:
            print(f"❌ Lỗi bulk_create: {e}")
            import traceback
            traceback.print_exc()

    print("✅ Import hoàn tất!")
    print(f"📊 Tổng xử lý: {processed}/{MAX_ROWS}")
    print(f"🖼️  Ảnh local: {have_local}")
    print(f"🌐  Ảnh URL: {have_remote - missing_any_image}")
    print(f"❌ Thiếu ảnh: {missing_any_image}")
    print(f"📂 Categories: {len(category_cache)}")
