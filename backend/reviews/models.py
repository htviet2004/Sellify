from django.conf import settings
from django.db import models

class Review(models.Model):
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('product', 'user')
        indexes = [
            models.Index(fields=['product', 'user']),
            models.Index(fields=['product']),
        ]

    def __str__(self):
        return f'{self.product_id} - {self.user_id} - {self.rating}'