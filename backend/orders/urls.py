from django.urls import path
from .views import (
    OrderCreateView, 
    OrderListView, 
    OrderDetailView, 
    OrderStatusUpdateView,
    seller_orders,
    seller_order_stats,
    seller_order_detail,
    seller_update_order_status,
)

urlpatterns = [
    # =====================
    # Customer endpoints
    # =====================
    path('', OrderCreateView.as_view(), name='order-create'),
    path('mine/', OrderListView.as_view(), name='order-list'),
    path('<str:order_id>/', OrderDetailView.as_view(), name='order-detail'),
    path('<str:order_id>/status/', OrderStatusUpdateView.as_view(), name='order-status'),

    # =====================
    # Seller endpoints
    # =====================
    path('seller/orders/', seller_orders, name='seller-orders'),
    path('seller/stats/', seller_order_stats, name='seller-order-stats'),
    path('seller/orders/<str:order_id>/', seller_order_detail, name='seller-order-detail'),
    path('seller/orders/<str:order_id>/status/', seller_update_order_status, name='seller-update-order-status'),
]
