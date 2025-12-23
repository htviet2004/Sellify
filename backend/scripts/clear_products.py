from django.db import connection
from products.models import Product

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
        
        # Bật lại foreign key check
        with connection.cursor() as cursor:
            cursor.execute('PRAGMA foreign_keys = ON;')
        
        print(f"✅ Đã xóa {product_count} products thành công!")
        
    except Exception as e:
        print(f"❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()


# 🔥 Quan trọng: gọi hàm run()
run()
