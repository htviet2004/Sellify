from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    # Authentication
    RegisterView,
    LoginView,
    LogoutView,
    
    # User Management
    UserDetailView,
    ChangePasswordView,
    DeleteAccountView,
    
    # Admin
    UserListView,
    UserManageView,
    UserStatusUpdateView,
    UserStatisticsView,
    
    # Profile
    ProfileView,
    current_user,
    upload_avatar,
    
    # Shop views (THÊM)
    get_all_shops,
    seller_shop_profile,
    shop_statistics,
)

# Admin views
from .admin_views import (
    AdminStatsView,
    AdminRevenueChartView,
    AdminUserManagementView,
    AdminProductManagementView,
    AdminOrderManagementView,
)

# Admin CRUD views
from .admin_crud_views import (
    # Users
    AdminUserListView, AdminUserDetailView, AdminUserCreateView,
    # Profiles
    AdminProfileListView, AdminProfileDetailView,
    # Products
    AdminProductListView, AdminProductDetailView, AdminProductCreateView,
    # Categories
    AdminCategoryListView, AdminCategoryDetailView, AdminCategoryCreateView,
    # Cart Items
    AdminCartItemListView, AdminCartItemDetailView, AdminCartItemCreateView,
    # Orders
    AdminOrderListView, AdminOrderDetailView, AdminOrderCreateView,
    # Order Items
    AdminOrderItemListView, AdminOrderItemDetailView,
    # Conversations
    AdminConversationListView, AdminConversationDetailView,
    # Messages
    AdminMessageListView, AdminMessageDetailView,
    # Reviews
    AdminReviewListView, AdminReviewDetailView, AdminReviewCreateView,
    # Wishlist Items
    AdminWishlistItemListView, AdminWishlistItemDetailView, AdminWishlistItemCreateView,
    # Saved Items
    AdminSavedItemListView, AdminSavedItemDetailView, AdminSavedItemCreateView,
)

urlpatterns = [
    # ==================== AUTHENTICATION ====================
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # ==================== USER MANAGEMENT ====================
    path('me/', UserDetailView.as_view(), name='user-detail'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('me/delete/', DeleteAccountView.as_view(), name='delete-account'),
    
    # ==================== PROFILE ====================
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/avatar/', upload_avatar, name='upload-avatar'),
    
    # ==================== ADMIN ====================
    path('', UserListView.as_view(), name='user-list'),  # Admin only
    path('<int:user_id>/', UserManageView.as_view(), name='user-manage'),  # Admin only
    path('<int:user_id>/status/', UserStatusUpdateView.as_view(), name='user-status'),  # Admin only
    path('statistics/', UserStatisticsView.as_view(), name='user-statistics'),  # Admin only
    
    # ==================== ADMIN DASHBOARD ====================
    path('admin/stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('admin/revenue-chart/', AdminRevenueChartView.as_view(), name='admin-revenue-chart'),
    path('admin/users/', AdminUserManagementView.as_view(), name='admin-users'),
    path('admin/products/', AdminProductManagementView.as_view(), name='admin-products'),
    path('admin/orders/', AdminOrderManagementView.as_view(), name='admin-orders'),
    
    # ==================== ADMIN CRUD - USERS ====================
    path('admin/crud/users/', AdminUserListView.as_view(), name='admin-crud-users-list'),
    path('admin/crud/users/create/', AdminUserCreateView.as_view(), name='admin-crud-users-create'),
    path('admin/crud/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-crud-users-detail'),
    
    # ==================== ADMIN CRUD - PROFILES ====================
    path('admin/crud/profiles/', AdminProfileListView.as_view(), name='admin-crud-profiles-list'),
    path('admin/crud/profiles/<int:pk>/', AdminProfileDetailView.as_view(), name='admin-crud-profiles-detail'),
    
    # ==================== ADMIN CRUD - PRODUCTS ====================
    path('admin/crud/products/', AdminProductListView.as_view(), name='admin-crud-products-list'),
    path('admin/crud/products/create/', AdminProductCreateView.as_view(), name='admin-crud-products-create'),
    path('admin/crud/products/<int:pk>/', AdminProductDetailView.as_view(), name='admin-crud-products-detail'),
    
    # ==================== ADMIN CRUD - CATEGORIES ====================
    path('admin/crud/categories/', AdminCategoryListView.as_view(), name='admin-crud-categories-list'),
    path('admin/crud/categories/create/', AdminCategoryCreateView.as_view(), name='admin-crud-categories-create'),
    path('admin/crud/categories/<int:pk>/', AdminCategoryDetailView.as_view(), name='admin-crud-categories-detail'),
    
    # ==================== ADMIN CRUD - CART ITEMS ====================
    path('admin/crud/cart-items/', AdminCartItemListView.as_view(), name='admin-crud-cart-items-list'),
    path('admin/crud/cart-items/create/', AdminCartItemCreateView.as_view(), name='admin-crud-cart-items-create'),
    path('admin/crud/cart-items/<int:pk>/', AdminCartItemDetailView.as_view(), name='admin-crud-cart-items-detail'),
    
    # ==================== ADMIN CRUD - ORDERS ====================
    path('admin/crud/orders/', AdminOrderListView.as_view(), name='admin-crud-orders-list'),
    path('admin/crud/orders/create/', AdminOrderCreateView.as_view(), name='admin-crud-orders-create'),
    path('admin/crud/orders/<str:pk>/', AdminOrderDetailView.as_view(), name='admin-crud-orders-detail'),
    
    # ==================== ADMIN CRUD - ORDER ITEMS ====================
    path('admin/crud/order-items/', AdminOrderItemListView.as_view(), name='admin-crud-order-items-list'),
    path('admin/crud/order-items/<int:pk>/', AdminOrderItemDetailView.as_view(), name='admin-crud-order-items-detail'),
    
    # ==================== ADMIN CRUD - CONVERSATIONS ====================
    path('admin/crud/conversations/', AdminConversationListView.as_view(), name='admin-crud-conversations-list'),
    path('admin/crud/conversations/<int:pk>/', AdminConversationDetailView.as_view(), name='admin-crud-conversations-detail'),
    
    # ==================== ADMIN CRUD - MESSAGES ====================
    path('admin/crud/messages/', AdminMessageListView.as_view(), name='admin-crud-messages-list'),
    path('admin/crud/messages/<int:pk>/', AdminMessageDetailView.as_view(), name='admin-crud-messages-detail'),
    
    # ==================== ADMIN CRUD - REVIEWS ====================
    path('admin/crud/reviews/', AdminReviewListView.as_view(), name='admin-crud-reviews-list'),
    path('admin/crud/reviews/create/', AdminReviewCreateView.as_view(), name='admin-crud-reviews-create'),
    path('admin/crud/reviews/<int:pk>/', AdminReviewDetailView.as_view(), name='admin-crud-reviews-detail'),
    
    # ==================== ADMIN CRUD - WISHLIST ITEMS ====================
    path('admin/crud/wishlist-items/', AdminWishlistItemListView.as_view(), name='admin-crud-wishlist-items-list'),
    path('admin/crud/wishlist-items/create/', AdminWishlistItemCreateView.as_view(), name='admin-crud-wishlist-items-create'),
    path('admin/crud/wishlist-items/<int:pk>/', AdminWishlistItemDetailView.as_view(), name='admin-crud-wishlist-items-detail'),
    
    # ==================== ADMIN CRUD - SAVED ITEMS ====================
    path('admin/crud/saved-items/', AdminSavedItemListView.as_view(), name='admin-crud-saved-items-list'),
    path('admin/crud/saved-items/create/', AdminSavedItemCreateView.as_view(), name='admin-crud-saved-items-create'),
    path('admin/crud/saved-items/<int:pk>/', AdminSavedItemDetailView.as_view(), name='admin-crud-saved-items-detail'),
    
    # ==================== SHOP ENDPOINTS (THÊM CUỐI) ====================
    path('shops/', get_all_shops, name='all-shops'),  # Danh sách tất cả shop
    path('shop/<int:seller_id>/', seller_shop_profile, name='seller-shop'),  # Shop detail + products
    path('shop/<int:seller_id>/stats/', shop_statistics, name='shop-stats'),  # Shop statistics
]