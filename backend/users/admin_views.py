from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework import status
from django.db.models import Count, Sum, Q, F, DecimalField
from django.db.models.functions import TruncDate, TruncMonth
from datetime import datetime, timedelta
from django.utils import timezone

from users.models import User
from products.models import Product, Category
from orders.models import Order, OrderItem
from reviews.models import Review


class AdminStatsView(APIView):
    """
    Lấy thống kê tổng quan cho admin dashboard
    GET /api/admin/stats/
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            # Thống kê users
            total_users = User.objects.count()
            active_users = User.objects.filter(status='active').count()
            buyers = User.objects.filter(user_type='buyer').count()
            sellers = User.objects.filter(user_type='seller').count()
            admins = User.objects.filter(user_type='admin').count()
            
            # Thống kê users mới (7 ngày qua)
            seven_days_ago = timezone.now() - timedelta(days=7)
            new_users = User.objects.filter(created_at__gte=seven_days_ago).count()

            # Thống kê products
            total_products = Product.objects.count()
            active_products = Product.objects.filter(is_active=True).count()
            out_of_stock = Product.objects.filter(stock=0).count()
            
            # Thống kê categories
            total_categories = Category.objects.count()

            # Thống kê orders
            total_orders = Order.objects.count()
            pending_orders = Order.objects.filter(status='pending').count()
            paid_orders = Order.objects.filter(status='paid').count()
            shipping_orders = Order.objects.filter(status='shipping').count()
            completed_orders = Order.objects.filter(status='completed').count()
            canceled_orders = Order.objects.filter(status='canceled').count()

            # Thống kê revenue
            total_revenue = Order.objects.filter(
                status__in=['paid', 'shipping', 'completed']
            ).aggregate(total=Sum('total_amount'))['total'] or 0

            # Revenue tháng này
            now = timezone.now()
            month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            monthly_revenue = Order.objects.filter(
                status__in=['paid', 'shipping', 'completed'],
                created_at__gte=month_start
            ).aggregate(total=Sum('total_amount'))['total'] or 0

            # Revenue hôm nay
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            today_revenue = Order.objects.filter(
                status__in=['paid', 'shipping', 'completed'],
                created_at__gte=today_start
            ).aggregate(total=Sum('total_amount'))['total'] or 0

            # Thống kê reviews
            try:
                total_reviews = Review.objects.count()
            except Exception as e:
                print(f"Error counting reviews: {e}")
                total_reviews = 0

            # Top selling products (7 ngày qua)
            try:
                top_products = OrderItem.objects.filter(
                    order__created_at__gte=seven_days_ago
                ).values(
                    'product__product_id',
                    'product__name',
                    'product__price'
                ).annotate(
                    total_sold=Sum('quantity')
                ).order_by('-total_sold')[:5]
                top_products = list(top_products)
            except Exception as e:
                print(f"Error getting top products: {e}")
                import traceback
                traceback.print_exc()
                top_products = []

            # Recent activity (10 hoạt động gần nhất)
            try:
                recent_users = User.objects.order_by('-created_at')[:5].values(
                    'username', 'user_type', 'created_at'
                )
                recent_users = list(recent_users)
            except Exception as e:
                print(f"Error getting recent users: {e}")
                recent_users = []

            try:
                recent_orders = Order.objects.order_by('-created_at')[:5].values(
                    'order_id', 'status', 'total_amount', 'created_at'
                )
                recent_orders = list(recent_orders)
            except Exception as e:
                print(f"Error getting recent orders: {e}")
                recent_orders = []

            return Response({
                'users': {
                    'total': total_users,
                    'active': active_users,
                    'buyers': buyers,
                    'sellers': sellers,
                    'admins': admins,
                    'new_last_7_days': new_users,
                },
                'products': {
                    'total': total_products,
                    'active': active_products,
                    'out_of_stock': out_of_stock,
                },
                'categories': {
                    'total': total_categories,
                },
                'orders': {
                    'total': total_orders,
                    'pending': pending_orders,
                    'paid': paid_orders,
                    'shipping': shipping_orders,
                    'completed': completed_orders,
                    'canceled': canceled_orders,
                },
                'revenue': {
                    'total': float(total_revenue),
                    'monthly': float(monthly_revenue),
                    'today': float(today_revenue),
                },
                'reviews': {
                    'total': total_reviews,
                },
                'top_products': top_products,
                'recent_activity': {
                    'users': recent_users,
                    'orders': recent_orders,
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            import traceback
            print(f"Error in AdminStatsView: {e}")
            traceback.print_exc()
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminRevenueChartView(APIView):
    """
    Lấy dữ liệu biểu đồ doanh thu theo ngày/tháng
    GET /api/admin/revenue-chart/?period=7days|30days|12months
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        period = request.query_params.get('period', '7days')
        now = timezone.now()

        try:
            if period == '7days':
                start_date = now - timedelta(days=7)
                revenue_data = Order.objects.filter(
                    status__in=['paid', 'shipping', 'completed'],
                    created_at__gte=start_date
                ).annotate(
                    date=TruncDate('created_at')
                ).values('date').annotate(
                    revenue=Sum('total_amount')
                ).order_by('date')

            elif period == '30days':
                start_date = now - timedelta(days=30)
                revenue_data = Order.objects.filter(
                    status__in=['paid', 'shipping', 'completed'],
                    created_at__gte=start_date
                ).annotate(
                    date=TruncDate('created_at')
                ).values('date').annotate(
                    revenue=Sum('total_amount')
                ).order_by('date')

            elif period == '12months':
                start_date = now - timedelta(days=365)
                revenue_data = Order.objects.filter(
                    status__in=['paid', 'shipping', 'completed'],
                    created_at__gte=start_date
                ).annotate(
                    month=TruncMonth('created_at')
                ).values('month').annotate(
                    revenue=Sum('total_amount')
                ).order_by('month')

            else:
                return Response({
                    'error': 'Invalid period parameter'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Format data
            chart_data = []
            for item in revenue_data:
                chart_data.append({
                    'date': item.get('date') or item.get('month'),
                    'revenue': float(item['revenue'] or 0)
                })

            return Response({
                'period': period,
                'data': chart_data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminUserManagementView(APIView):
    """
    Quản lý users: list, update status, delete
    GET /api/admin/users/?user_type=buyer|seller|admin&status=active|inactive
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        user_type = request.query_params.get('user_type')
        status_filter = request.query_params.get('status')
        search = request.query_params.get('search', '')

        users = User.objects.all()

        if user_type:
            users = users.filter(user_type=user_type)
        if status_filter:
            users = users.filter(status=status_filter)
        if search:
            users = users.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(full_name__icontains=search)
            )

        users_data = users.values(
            'user_id', 'username', 'email', 'full_name', 
            'user_type', 'status', 'created_at'
        ).order_by('-created_at')

        return Response({
            'users': list(users_data),
            'total': users.count()
        }, status=status.HTTP_200_OK)


class AdminProductManagementView(APIView):
    """
    Quản lý products: list, statistics
    GET /api/admin/products/?status=active|inactive&category=<id>
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        is_active = request.query_params.get('is_active')
        category = request.query_params.get('category')
        search = request.query_params.get('search', '')

        products = Product.objects.select_related('seller', 'category')

        if is_active is not None:
            products = products.filter(is_active=is_active.lower() == 'true')
        if category:
            products = products.filter(category_id=category)
        if search:
            products = products.filter(
                Q(name__icontains=search) |
                Q(seller__username__icontains=search)
            )

        products_data = products.values(
            'product_id', 'name', 'price', 'stock', 'is_active',
            'seller__username', 'category__name', 'created_at'
        ).order_by('-created_at')[:100]

        return Response({
            'products': list(products_data),
            'total': products.count()
        }, status=status.HTTP_200_OK)


class AdminOrderManagementView(APIView):
    """
    Quản lý orders: list, statistics
    GET /api/admin/orders/?status=pending|paid|shipping|completed|canceled
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        order_status = request.query_params.get('status')
        search = request.query_params.get('search', '')

        orders = Order.objects.select_related('user')

        if order_status:
            orders = orders.filter(status=order_status)
        if search:
            orders = orders.filter(
                Q(order_id__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search)
            )

        orders_data = orders.values(
            'order_id', 'full_name', 'email', 'phone',
            'status', 'total_amount', 'payment_method', 'created_at'
        ).order_by('-created_at')[:100]

        return Response({
            'orders': list(orders_data),
            'total': orders.count()
        }, status=status.HTTP_200_OK)
