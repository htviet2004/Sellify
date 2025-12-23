from rest_framework import viewsets, mixins, status
from rest_framework.permissions import IsAuthenticated
from products.views import BuyerOnlyPermission
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from .models import CartItem
from .serializers import CartItemSerializer, CartItemCreateSerializer
from products.models import Product
from orders.models import Order, OrderItem
from orders.serializers import OrderResponseSerializer
from django.db import transaction


class CartItemViewSet(mixins.ListModelMixin,
                      mixins.CreateModelMixin,
                      mixins.UpdateModelMixin,
                      mixins.DestroyModelMixin,
                      viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated, BuyerOnlyPermission]

    def get_queryset(self):
        return CartItem.objects.filter(user=self.request.user).select_related('product').order_by('-added_at')

    def get_serializer_class(self):
        return CartItemSerializer

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        serializer = CartItemSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = CartItemCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        product = Product.objects.get(id=data['product_id'])
        color = (data.get('color') or '').strip()
        size = (data.get('size') or '').strip()
        quantity = int(data.get('quantity') or 1)

        if product.stock is not None and quantity > product.stock:
            return Response({'quantity': ['Quantity exceeds available stock.']}, status=status.HTTP_400_BAD_REQUEST)

        instance = CartItem.objects.filter(
            user=request.user,
            product=product,
            color=color,
            size=size,
        ).first()

        if instance:
            new_q = instance.quantity + quantity
            if product.stock is not None and new_q > product.stock:
                return Response({'quantity': ['Quantity exceeds available stock.']}, status=status.HTTP_400_BAD_REQUEST)
            instance.quantity = new_q
            instance.save(update_fields=['quantity', 'updated_at'])
            status_code = status.HTTP_200_OK
        else:
            instance = CartItem.objects.create(
                user=request.user,
                product=product,
                quantity=quantity,
                color=color,
                size=size,
            )
            status_code = status.HTTP_201_CREATED

        out = CartItemSerializer(instance, context={'request': request})
        return Response(out.data, status=status_code)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.user != request.user:
            raise PermissionDenied('Not allowed to modify this cart item')
        quantity = request.data.get('quantity')
        if quantity is None:
            return Response({'detail': 'quantity is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return Response({'detail': 'quantity must be an integer'}, status=status.HTTP_400_BAD_REQUEST)
        if quantity < 1:
            return Response({'quantity': ['Quantity must be at least 1.']}, status=status.HTTP_400_BAD_REQUEST)
        if instance.product.stock is not None and quantity > instance.product.stock:
            return Response({'quantity': ['Quantity exceeds available stock.']}, status=status.HTTP_400_BAD_REQUEST)
        instance.quantity = quantity
        instance.save(update_fields=['quantity', 'updated_at'])
        return Response(CartItemSerializer(instance, context={'request': request}).data)

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.user != request.user:
            raise PermissionDenied('Not allowed to delete this cart item')
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CheckoutView(APIView):
    permission_classes = [IsAuthenticated, BuyerOnlyPermission]

    def post(self, request):
        # create an order from the current user's cart

        cart_items = CartItem.objects.filter(user=request.user).select_related('product')
        if not cart_items.exists():
            return Response({'detail': 'Giỏ hàng trống'}, status=status.HTTP_400_BAD_REQUEST)

        # Required shipping/payment fields
        data = request.data or {}
        required = ['full_name', 'phone', 'email', 'address', 'ward', 'district', 'city']
        missing = [f for f in required if not data.get(f)]
        if missing:
            return Response({'detail': f'Thieu thong tin: {", ".join(missing)}'}, status=status.HTTP_400_BAD_REQUEST)

        # check stock and compute total
        items_info = []
        total = 0
        for it in cart_items:
            p = it.product
            if p.stock is not None and it.quantity > p.stock:
                return Response({'detail': f'Sản phẩm {p.id} không đủ tồn kho'}, status=status.HTTP_400_BAD_REQUEST)
            price = p.price
            line_total = price * it.quantity
            total += line_total
            items_info.append({
                'product': p,
                'quantity': it.quantity,
                'color': it.color,
                'size': it.size,
                'price': price,
            })

        # create order atomically
        with transaction.atomic():
            order = Order.objects.create(
                user=request.user,
                full_name=data.get('full_name'),
                phone=data.get('phone'),
                email=data.get('email'),
                address=data.get('address'),
                ward=data.get('ward'),
                district=data.get('district'),
                city=data.get('city'),
                payment_method=data.get('payment_method', 'cod'),
                notes=data.get('notes', ''),
                total_amount=total,
            )
            # create items and decrement stock
            for info in items_info:
                OrderItem.objects.create(
                    order=order,
                    product=info['product'],
                    quantity=info['quantity'],
                    color=info['color'],
                    size=info['size'],
                    price=info['price'],
                )
                # decrement stock if tracked
                prod = info['product']
                if prod.stock is not None:
                    prod.stock = max(0, prod.stock - info['quantity'])
                    prod.save(update_fields=['stock'])

            # clear cart
            cart_items.delete()

        serializer = OrderResponseSerializer(order, context={'request': request})
        return Response({'success': True, 'order': serializer.data}, status=status.HTTP_201_CREATED)
