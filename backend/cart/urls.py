from django.urls import path
from .views import CartItemViewSet, CheckoutView

cart_list = CartItemViewSet.as_view({'get': 'list', 'post': 'create'})
cart_detail = CartItemViewSet.as_view({'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'})

urlpatterns = [
    path('', cart_list, name='cart-list'),
    path('checkout/', CheckoutView.as_view(), name='cart-checkout'),
    path('<int:pk>/', cart_detail, name='cart-detail'),
]
