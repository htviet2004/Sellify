from django.urls import path
from .views import (
    ProductViewSet,
    CategoryViewSet,
    ImageSearchView,
    TextSearchView,
    WishlistViewSet,
    SavedItemViewSet,
    seller_products,
    seller_stats,
    seller_product_detail,
    toggle_product_status,
)

urlpatterns = [
    # Product URLs
    path('products/', ProductViewSet.as_view({'get': 'list', 'post': 'create'}), name='product-list'),
    path('products/<int:pk>/', ProductViewSet.as_view({
        'get': 'retrieve', 
        'put': 'update', 
        'patch': 'partial_update', 
        'delete': 'destroy'
    }), name='product-detail'),

    # Category URLs
    path('categories/', CategoryViewSet.as_view({'get': 'list', 'post': 'create'}), name='category-list'),
    path('categories/<int:pk>/', CategoryViewSet.as_view({
        'get': 'retrieve', 
        'put': 'update', 
        'patch': 'partial_update', 
        'delete': 'destroy'
    }), name='category-detail'),

    # Image search
    path('search/image/', ImageSearchView.as_view(), name='image-search'),
    
    # Text search with CLIP
    path('search/text/', TextSearchView.as_view(), name='text-search'),

    # Wishlist URLs
    path('products/wishlist/', WishlistViewSet.as_view({'get': 'list', 'post': 'create'}), name='wishlist-list'),
    path('products/wishlist/<int:pk>/', WishlistViewSet.as_view({'delete': 'destroy'}), name='wishlist-detail'),

    # SavedItem URLs
    path('products/saved-items/', SavedItemViewSet.as_view({'get': 'list', 'post': 'create'}), name='saveditem-list'),
    path('products/saved-items/<int:pk>/', SavedItemViewSet.as_view({
        'put': 'update', 
        'patch': 'partial_update', 
        'delete': 'destroy'
    }), name='saveditem-detail'),

    # Seller-specific endpoints
    path('seller/products/', seller_products, name='seller-products'),
    path('seller/stats/', seller_stats, name='seller-stats'),
    path('seller/products/<int:pk>/', seller_product_detail, name='seller-product-detail'),

    # Product management toggle
    path('products/<int:pk>/toggle/', toggle_product_status, name='toggle-product-status'),
]
