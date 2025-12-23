from rest_framework import serializers
from .models import Order, OrderItem
from products.models import Product

class OrderItemCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField()
    color = serializers.CharField(required=False, allow_blank=True)
    size = serializers.CharField(required=False, allow_blank=True)
    price = serializers.DecimalField(max_digits=12, decimal_places=2)

    def validate_product_id(self, v):
        if not Product.objects.filter(id=v).exists():
            raise serializers.ValidationError("Sản phẩm không tồn tại")
        return v

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemCreateSerializer(many=True)

    class Meta:
        model = Order
        fields = (
            'order_id','full_name','phone','email',
            'address','ward','district','city',
            'payment_method','notes','items','total_amount'
        )

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        order = Order.objects.create(**validated_data)
        for it in items_data:
            OrderItem.objects.create(
                order=order,
                product_id=it['product_id'],
                quantity=it['quantity'],
                color=it.get('color',''),
                size=it.get('size',''),
                price=it['price']
            )
        return order

class OrderItemResponseSerializer(serializers.ModelSerializer):
    """Serializer for an order item used in responses."""
    product = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = (
            'id',
            'product_id',
            'product',
            'quantity',
            'price',
            'color',
            'size',
        )

    def get_product(self, obj):
        p = getattr(obj, 'product', None)
        if p is None:
            return {'id': obj.product_id}
        image = None
        try:
            if getattr(p, 'image', None):
                image_field = getattr(p, 'image')
                image = image_field.url if hasattr(image_field, 'url') else None
        except Exception:
            image = None
        return {
            'id': p.id,
            'name': getattr(p, 'name', None),
            'image': image,
        }


class OrderResponseSerializer(serializers.ModelSerializer):
    items = OrderItemResponseSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    items_count = serializers.SerializerMethodField()
    buyer_name = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'order_id',
            'user',
            'buyer_name',
            'full_name',
            'phone',
            'email',
            'address',
            'ward',
            'district',
            'city',
            'payment_method',
            'notes',
            'status',
            'status_display',
            'total_amount',
            'items',
            'items_count',
            'created_at',
        ]

    def get_items_count(self, obj):
        return obj.items.count()

    def get_buyer_name(self, obj):
        if obj.user:
            return getattr(obj.user, 'full_name', None) or obj.user.username
        return obj.full_name


class OrderListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing orders"""
    items_count = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    buyer_name = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'order_id',
            'buyer_name',
            'full_name',
            'phone',
            'status',
            'status_display',
            'payment_method',
            'total_amount',
            'items_count',
            'created_at',
        ]

    def get_items_count(self, obj):
        return obj.items.count()

    def get_buyer_name(self, obj):
        if obj.user:
            return getattr(obj.user, 'full_name', None) or obj.user.username
        return obj.full_name


class OrderItemSerializer(serializers.ModelSerializer):
    """Full serializer for OrderItem admin CRUD"""
    product_name = serializers.CharField(source='product.name', read_only=True)
    order_id_display = serializers.CharField(source='order.order_id', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'order', 'order_id_display', 'product', 'product_name', 
                  'quantity', 'price', 'color', 'size']
        read_only_fields = ['id']
