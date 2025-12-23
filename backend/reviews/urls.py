from django.urls import path
from .views import ProductReviewsView, ProductReviewEligibilityView

urlpatterns = [
    path('products/<int:product_id>/reviews/', ProductReviewsView.as_view(), name='product-reviews'),
    path('products/<int:product_id>/reviews/eligibility/', ProductReviewEligibilityView.as_view(), name='product-review-eligibility'),
]