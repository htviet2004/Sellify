from django.contrib import admin
from .models import Product, Category, WishlistItem, SavedItem

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'seller', 'category', 'price', 'stock', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at', 'category')
    search_fields = ('name', 'seller__username', 'seller__email')


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'parent', 'is_active', 'created_at')
    search_fields = ('name',)
    list_filter = ('is_active',)
    prepopulated_fields = {'slug': ('name',)}


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'product', 'color', 'size', 'created_at')
    search_fields = ('user__username', 'product__name')
    list_filter = ('created_at',)


@admin.register(SavedItem)
class SavedItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'product', 'quantity', 'color', 'size', 'moved_from_cart_at')
    search_fields = ('user__username', 'product__name')
    list_filter = ('moved_from_cart_at',)