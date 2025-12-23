from rest_framework import serializers
from .models import CartItem
from products.models import Product


class CartItemAdminSerializer(serializers.ModelSerializer):
    """Simple serializer for admin CRUD"""
    username = serializers.CharField(source='user.username', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = CartItem
        fields = ['id', 'user', 'username', 'product', 'product_name', 
                  'quantity', 'color', 'size', 'added_at', 'updated_at']
        read_only_fields = ['id', 'username', 'product_name', 'added_at', 'updated_at']


class CartItemCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(default=1)
    color = serializers.CharField(required=False, allow_blank=True)
    size = serializers.CharField(required=False, allow_blank=True)

    def validate_product_id(self, v):
        if not Product.objects.filter(id=v).exists():
            raise serializers.ValidationError("Sản phẩm không tồn tại")
        return v


class CartItemSerializer(serializers.ModelSerializer):
    product = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ('id', 'product_id', 'product', 'quantity', 'color', 'size', 'added_at', 'updated_at')

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
            'price': str(getattr(p, 'price', None)),
            'image': image,
        }
