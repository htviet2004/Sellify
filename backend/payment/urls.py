from django.urls import path
from .views import create_vnpay_payment, vnpay_return

urlpatterns = [
    path('vnpay/', create_vnpay_payment, name='vnpay-create'),
    path('vnpay_return/', vnpay_return, name='vnpay-return'),
]
