from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Q, Count, Sum
from .serializers import (
    OrderSerializer, 
    OrderResponseSerializer, 
    OrderListSerializer
)
from .models import Order, OrderItem
import time

def generate_order_id():
    return "ORD" + str(int(time.time()))[-8:]


class OrderCreateView(APIView):
    permission_classes = []  # cho phép khách đặt hàng
    
    def post(self, request):
        data = request.data.copy()
        data['order_id'] = generate_order_id()
        serializer = OrderSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save(user=request.user if request.user.is_authenticated else None)
        return Response({
            'success': True,
            'order': OrderResponseSerializer(order, context={'request': request}).data
        }, status=201)


class OrderListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        qs = Order.objects.filter(user=request.user).prefetch_related('items__product').order_by('-created_at')
        data = [OrderResponseSerializer(o, context={'request': request}).data for o in qs]
        return Response({'results': data})


class OrderDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, order_id):
        try:
            order = Order.objects.prefetch_related('items__product').get(
                order_id=order_id, 
                user=request.user
            )
        except Order.DoesNotExist:
            return Response({'detail': 'Không tìm thấy'}, status=404)
        return Response({
            'order': OrderResponseSerializer(order, context={'request': request}).data
        })


class OrderStatusUpdateView(APIView):
    permission_classes = [permissions.IsAdminUser]
    
    def patch(self, request, order_id):
        status_value = request.data.get('status')
        if status_value not in ['pending', 'paid', 'shipping', 'completed', 'canceled']:
            return Response({'detail': 'Trạng thái không hợp lệ'}, status=400)
        try:
            order = Order.objects.get(order_id=order_id)
        except Order.DoesNotExist:
            return Response({'detail': 'Không tìm thấy'}, status=404)
        order.status = status_value
        order.save()
        return Response({
            'success': True, 
            'order': OrderResponseSerializer(order, context={'request': request}).data
        })


# ============================================
# SELLER ORDER ENDPOINTS
# ============================================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def seller_orders(request):
    """
    Lấy danh sách đơn hàng chứa sản phẩm của seller
    GET /api/orders/seller/orders/
    """
    try:
        seller = request.user
        
        # Lấy order_id của các đơn hàng có chứa sản phẩm của seller
        order_ids = OrderItem.objects.filter(
            product__seller=seller
        ).values_list('order_id', flat=True).distinct()
        
        # Lấy các orders
        orders = Order.objects.filter(
            id__in=order_ids
        ).prefetch_related('items__product').order_by('-created_at')
        
        # Filter theo status
        status_filter = request.GET.get('status')
        if status_filter:
            orders = orders.filter(status=status_filter)
        
        # Search
        search = request.GET.get('search')
        if search:
            orders = orders.filter(
                Q(order_id__icontains=search) |
                Q(full_name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search)
            )
        
        # Build response với chỉ items của seller
        orders_data = []
        for order in orders:
            # Lọc items thuộc seller
            seller_items = order.items.filter(product__seller=seller).select_related('product')
            
            # Tính tổng tiền của seller trong đơn hàng này
            seller_total = sum(item.price * item.quantity for item in seller_items)
            
            # Serialize items
            items_data = []
            for item in seller_items:
                items_data.append({
                    'id': item.id,
                    'product_id': item.product.id,
                    'product_name': item.product.name,
                    'product_image': request.build_absolute_uri(item.product.image.url) if item.product.image else None,
                    'quantity': item.quantity,
                    'color': item.color,
                    'size': item.size,
                    'price': float(item.price),
                    'total': float(item.price * item.quantity),
                })
            
            orders_data.append({
                'order_id': order.order_id,
                'buyer_name': order.user.full_name if (order.user and hasattr(order.user, 'full_name')) else order.full_name,
                'buyer_email': order.email,
                'buyer_phone': order.phone,
                'full_name': order.full_name,
                'address': order.address,
                'ward': order.ward,
                'district': order.district,
                'city': order.city,
                'payment_method': order.payment_method,
                'notes': order.notes,
                'status': order.status,
                'status_display': order.get_status_display(),
                'seller_total': float(seller_total),
                'items': items_data,
                'items_count': len(items_data),
                'created_at': order.created_at,
            })
        
        return Response({
            'success': True,
            'count': len(orders_data),
            'results': orders_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def seller_order_stats(request):
    """
    Thống kê đơn hàng của seller
    GET /api/orders/seller/stats/
    """
    try:
        seller = request.user
        
        # Lấy order_id của các đơn hàng có chứa sản phẩm của seller
        order_ids = OrderItem.objects.filter(
            product__seller=seller
        ).values_list('order_id', flat=True).distinct()
        
        orders = Order.objects.filter(id__in=order_ids)
        
        # Đếm theo status
        total = orders.count()
        pending = orders.filter(status='pending').count()
        paid = orders.filter(status='paid').count()
        shipping = orders.filter(status='shipping').count()
        completed = orders.filter(status='completed').count()
        canceled = orders.filter(status='canceled').count()
        
        # Tính tổng doanh thu (chỉ đơn completed)
        completed_order_ids = orders.filter(status='completed').values_list('id', flat=True)
        seller_items = OrderItem.objects.filter(
            order_id__in=completed_order_ids,
            product__seller=seller
        ).select_related('product')
        
        total_revenue = sum(item.price * item.quantity for item in seller_items)
        
        # Đơn hôm nay
        from datetime import datetime
        today = datetime.now().date()
        today_orders = orders.filter(created_at__date=today).count()
        
        stats = {
            'total': total,
            'pending': pending,
            'paid': paid,
            'shipping': shipping,
            'completed': completed,
            'canceled': canceled,
            'today': today_orders,
            'total_revenue': float(total_revenue),
        }
        
        return Response(stats, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def seller_order_detail(request, order_id):
    """
    Chi tiết đơn hàng của seller
    GET /api/orders/seller/orders/<order_id>/
    """
    try:
        seller = request.user
        
        # Lấy order
        try:
            order = Order.objects.prefetch_related('items__product').get(order_id=order_id)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Không tìm thấy đơn hàng'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Kiểm tra seller có sản phẩm trong đơn này không
        seller_items = order.items.filter(product__seller=seller).select_related('product')
        
        if not seller_items.exists():
            return Response(
                {'error': 'Bạn không có sản phẩm trong đơn hàng này'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Tính tổng
        seller_total = sum(item.price * item.quantity for item in seller_items)
        
        # Serialize items
        items_data = []
        for item in seller_items:
            items_data.append({
                'id': item.id,
                'product_id': item.product.id,
                'product_name': item.product.name,
                'product_image': request.build_absolute_uri(item.product.image.url) if item.product.image else None,
                'quantity': item.quantity,
                'color': item.color,
                'size': item.size,
                'price': float(item.price),
                'total': float(item.price * item.quantity),
            })
        
        order_data = {
            'order_id': order.order_id,
            'buyer_name': order.user.full_name if (order.user and hasattr(order.user, 'full_name')) else order.full_name,
            'buyer_email': order.email,
            'buyer_phone': order.phone,
            'full_name': order.full_name,
            'address': order.address,
            'ward': order.ward,
            'district': order.district,
            'city': order.city,
            'payment_method': order.payment_method,
            'notes': order.notes,
            'status': order.status,
            'status_display': order.get_status_display(),
            'seller_total': float(seller_total),
            'items': items_data,
            'items_count': len(items_data),
            'created_at': order.created_at,
        }
        
        return Response(order_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def seller_update_order_status(request, order_id):
    """
    Seller cập nhật trạng thái đơn hàng
    PATCH /api/orders/seller/orders/<order_id>/status/
    """
    try:
        seller = request.user
        
        # Lấy order
        try:
            order = Order.objects.get(order_id=order_id)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Không tìm thấy đơn hàng'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Kiểm tra seller có sản phẩm trong đơn này không
        has_products = OrderItem.objects.filter(
            order=order,
            product__seller=seller
        ).exists()
        
        if not has_products:
            return Response(
                {'error': 'Bạn không có quyền cập nhật đơn hàng này'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Lấy status mới
        new_status = request.data.get('status')
        if not new_status:
            return Response(
                {'error': 'Vui lòng cung cấp trạng thái mới'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate status
        valid_statuses = ['pending', 'paid', 'shipping', 'completed', 'canceled']
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Trạng thái không hợp lệ. Phải là một trong: {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Cập nhật
        order.status = new_status
        order.save()
        
        return Response({
            'success': True,
            'message': 'Cập nhật trạng thái thành công',
            'order': OrderResponseSerializer(order, context={'request': request}).data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
