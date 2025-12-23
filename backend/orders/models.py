from django.conf import settings
from django.db import models
from products.models import Product
import time

def gen_order_id():
    return "ORD" + str(int(time.time()))[-8:]

class Order(models.Model):
    STATUS = (
        ('pending','Pending'),
        ('paid','Paid'),
        ('shipping','Shipping'),
        ('completed','Completed'),
        ('canceled','Canceled'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    order_id = models.CharField(max_length=20, unique=True, db_index=True)
    full_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    address = models.CharField(max_length=255)
    ward = models.CharField(max_length=50)
    district = models.CharField(max_length=50)
    city = models.CharField(max_length=50)
    payment_method = models.CharField(max_length=20, default='cod')
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default='pending')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.order_id:
            self.order_id = gen_order_id()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.order_id

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    color = models.CharField(max_length=30, blank=True)
    size = models.CharField(max_length=30, blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.product_id} x{self.quantity}"
