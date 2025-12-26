import shutil
from pathlib import Path

from django.conf import settings
from django.db import connection
from products.models import Product


def _clean_product_media():
    """Delete media/products directory contents safely."""
    media_root = Path(settings.MEDIA_ROOT)
    products_dir = media_root / "products"
    if products_dir.exists() and products_dir.is_dir():
        shutil.rmtree(products_dir, ignore_errors=True)
        products_dir.mkdir(parents=True, exist_ok=True)
        print(f"🧹 Đã xoá thư mục ảnh sản phẩm: {products_dir}")
    else:
        print(f"ℹ️ Không tìm thấy thư mục ảnh sản phẩm: {products_dir}")

def run():
    print("🔄 Đang xóa products và dữ liệu liên quan...")
    
    try:
        # Import OrderItem model
        try:
            from orders.models import OrderItem
            orderitem_exists = True
        except ImportError:
            try:
                from order.models import OrderItem
                orderitem_exists = True
            except ImportError:
                orderitem_exists = False
        
        # Đếm trước khi xóa
        product_count = Product.objects.count()
        print(f"📊 Tìm thấy {product_count} products")
        
        if product_count == 0:
            print("⚠️ Database đã trống!")
            return
        
        # Xóa OrderItems trước (nếu có)
        if orderitem_exists:
            orderitem_count = OrderItem.objects.count()
            if orderitem_count > 0:
                print(f"🗑️ Đang xóa {orderitem_count} order items...")
                OrderItem.objects.all().delete()
                print(f"✅ Đã xóa {orderitem_count} order items")
        
        # Tắt foreign key check (SQLite)
        with connection.cursor() as cursor:
            cursor.execute('PRAGMA foreign_keys = OFF;')
        
        # Xóa tất cả products
        Product.objects.all().delete()

        # Xóa ảnh sản phẩm trong MEDIA_ROOT/products
        _clean_product_media()
        
        # Bật lại foreign key check
        with connection.cursor() as cursor:
            cursor.execute('PRAGMA foreign_keys = ON;')
        
        print(f"✅ Đã xóa {product_count} products thành công!")
        
    except Exception as e:
        print(f"❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()


# 🔥 Quan trọng: chỉ chạy khi gọi trực tiếp, tránh auto-import làm xóa dữ liệu ngoài ý muốn
if __name__ == "__main__":
    run()
