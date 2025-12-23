from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL


class CartItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cart_items')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='in_carts')
    quantity = models.PositiveIntegerField(default=1)
    color = models.CharField(max_length=50, blank=True)
    size = models.CharField(max_length=50, blank=True)
    added_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-added_at']
        constraints = [
            models.UniqueConstraint(
                fields=('user', 'product', 'color', 'size'),
                name='uniq_cart_user_product_variant'
            )
        ]

    def __str__(self):
        return f"CartItem: {self.user} - {self.product} x{self.quantity}"
