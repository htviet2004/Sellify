"""
Admin CRUD Views - Generic views for all models
Similar to Django Admin functionality
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework import status
from django.core.paginator import Paginator
from django.db.models import Q

from users.models import User, Profile
from products.models import Product, Category, WishlistItem, SavedItem
from cart.models import CartItem
from orders.models import Order, OrderItem
from chat.models import Conversation, Message
from reviews.models import Review

from users.serializers import UserSerializer, ProfileSerializer, ProfileAdminSerializer
from products.serializers import ProductSerializer, CategorySerializer, WishlistItemSerializer, SavedItemSerializer
from cart.serializers import CartItemSerializer, CartItemAdminSerializer
from orders.serializers import OrderResponseSerializer, OrderItemSerializer
from chat.serializers import ConversationSerializer, MessageSerializer, ConversationAdminSerializer, MessageAdminSerializer
from reviews.serializers import ReviewSerializer


class AdminCRUDView(APIView):
    """Base class for CRUD operations"""
    permission_classes = [IsAdminUser]
    model = None
    serializer_class = None
    search_fields = []
    filter_fields = {}
    ordering = ['-id']
    
    def get_queryset(self):
        return self.model.objects.all()
    
    def apply_search(self, queryset, search):
        if not search or not self.search_fields:
            return queryset
        
        q_objects = Q()
        for field in self.search_fields:
            q_objects |= Q(**{f"{field}__icontains": search})
        return queryset.filter(q_objects)
    
    def apply_filters(self, queryset, filters):
        for key, value in filters.items():
            if key in self.filter_fields and value:
                queryset = queryset.filter(**{self.filter_fields[key]: value})
        return queryset
    
    def get(self, request):
        """List all objects with pagination, search, and filters"""
        try:
            queryset = self.get_queryset()
            
            # Search
            search = request.query_params.get('search', '')
            if search:
                queryset = self.apply_search(queryset, search)
            
            # Filters
            filters = {k: v for k, v in request.query_params.items() 
                      if k not in ['search', 'page', 'page_size']}
            queryset = self.apply_filters(queryset, filters)
            
            # Ordering
            queryset = queryset.order_by(*self.ordering)
            
            # Pagination
            page_size = int(request.query_params.get('page_size', 20))
            page_number = int(request.query_params.get('page', 1))
            paginator = Paginator(queryset, page_size)
            page_obj = paginator.get_page(page_number)
            
            serializer = self.serializer_class(page_obj.object_list, many=True)
            
            return Response({
                'results': serializer.data,
                'count': paginator.count,
                'total_pages': paginator.num_pages,
                'current_page': page_number,
                'page_size': page_size,
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminDetailView(APIView):
    """Base class for detail/update/delete operations"""
    permission_classes = [IsAdminUser]
    model = None
    serializer_class = None
    lookup_field = 'pk'
    
    def get_object(self, pk):
        try:
            return self.model.objects.get(pk=pk)
        except self.model.DoesNotExist:
            return None
    
    def get(self, request, pk):
        """Get single object"""
        obj = self.get_object(pk)
        if not obj:
            return Response({
                'error': 'Object not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = self.serializer_class(obj)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request, pk):
        """Update object"""
        obj = self.get_object(pk)
        if not obj:
            return Response({
                'error': 'Object not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = self.serializer_class(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        """Delete object"""
        obj = self.get_object(pk)
        if not obj:
            return Response({
                'error': 'Object not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        obj.delete()
        return Response({
            'message': 'Object deleted successfully'
        }, status=status.HTTP_204_NO_CONTENT)


class AdminCreateView(APIView):
    """Base class for create operations"""
    permission_classes = [IsAdminUser]
    serializer_class = None
    
    def post(self, request):
        """Create new object"""
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==================== USERS ====================
class AdminUserListView(AdminCRUDView):
    model = User
    serializer_class = UserSerializer
    search_fields = ['username', 'email', 'full_name']
    filter_fields = {
        'user_type': 'user_type',
        'status': 'status',
    }
    ordering = ['-user_id']


class AdminUserDetailView(AdminDetailView):
    model = User
    serializer_class = UserSerializer
    lookup_field = 'user_id'
    
    def get_object(self, pk):
        try:
            return self.model.objects.get(user_id=pk)
        except self.model.DoesNotExist:
            return None


class AdminUserCreateView(AdminCreateView):
    serializer_class = UserSerializer


# ==================== PROFILES ====================
class AdminProfileListView(AdminCRUDView):
    model = Profile
    serializer_class = ProfileAdminSerializer
    search_fields = ['user__username', 'user__email']
    ordering = ['-id']


class AdminProfileDetailView(AdminDetailView):
    model = Profile
    serializer_class = ProfileAdminSerializer


# ==================== PRODUCTS ====================
class AdminProductListView(AdminCRUDView):
    model = Product
    serializer_class = ProductSerializer
    search_fields = ['name', 'seller__username']
    filter_fields = {
        'is_active': 'is_active',
        'category': 'category_id',
    }
    ordering = ['-id']


class AdminProductDetailView(AdminDetailView):
    model = Product
    serializer_class = ProductSerializer


class AdminProductCreateView(AdminCreateView):
    serializer_class = ProductSerializer


# ==================== CATEGORIES ====================
class AdminCategoryListView(AdminCRUDView):
    model = Category
    serializer_class = CategorySerializer
    search_fields = ['name']
    filter_fields = {
        'is_active': 'is_active',
    }
    ordering = ['name']


class AdminCategoryDetailView(AdminDetailView):
    model = Category
    serializer_class = CategorySerializer


class AdminCategoryCreateView(AdminCreateView):
    serializer_class = CategorySerializer


# ==================== CART ITEMS ====================
class AdminCartItemListView(AdminCRUDView):
    model = CartItem
    serializer_class = CartItemAdminSerializer
    search_fields = ['user__username', 'product__name']
    ordering = ['-added_at']


class AdminCartItemDetailView(AdminDetailView):
    model = CartItem
    serializer_class = CartItemAdminSerializer


class AdminCartItemCreateView(AdminCreateView):
    serializer_class = CartItemAdminSerializer


# ==================== ORDERS ====================
class AdminOrderListView(AdminCRUDView):
    model = Order
    serializer_class = OrderResponseSerializer
    search_fields = ['order_id', 'email', 'phone', 'full_name']
    filter_fields = {
        'status': 'status',
        'payment_method': 'payment_method',
    }
    ordering = ['-created_at']


class AdminOrderDetailView(AdminDetailView):
    model = Order
    serializer_class = OrderResponseSerializer
    lookup_field = 'order_id'
    
    def get_object(self, pk):
        try:
            return self.model.objects.get(order_id=pk)
        except self.model.DoesNotExist:
            return None


class AdminOrderCreateView(AdminCreateView):
    serializer_class = OrderResponseSerializer


# ==================== ORDER ITEMS ====================
class AdminOrderItemListView(AdminCRUDView):
    model = OrderItem
    serializer_class = OrderItemSerializer
    search_fields = ['order__order_id', 'product__name']
    ordering = ['-id']


class AdminOrderItemDetailView(AdminDetailView):
    model = OrderItem
    serializer_class = OrderItemSerializer


# ==================== CONVERSATIONS ====================
class AdminConversationListView(AdminCRUDView):
    model = Conversation
    serializer_class = ConversationAdminSerializer
    search_fields = ['buyer__username', 'shop__username']
    ordering = ['-created_at']


class AdminConversationDetailView(AdminDetailView):
    model = Conversation
    serializer_class = ConversationAdminSerializer


# ==================== MESSAGES ====================
class AdminMessageListView(AdminCRUDView):
    model = Message
    serializer_class = MessageAdminSerializer
    search_fields = ['sender__username', 'content']
    filter_fields = {
        'conversation': 'conversation_id',
    }
    ordering = ['-created_at']


class AdminMessageDetailView(AdminDetailView):
    model = Message
    serializer_class = MessageAdminSerializer


# ==================== REVIEWS ====================
class AdminReviewListView(AdminCRUDView):
    model = Review
    serializer_class = ReviewSerializer
    search_fields = ['user__username', 'product__name', 'comment']
    filter_fields = {
        'rating': 'rating',
        'product': 'product_id',
    }
    ordering = ['-created_at']


class AdminReviewDetailView(AdminDetailView):
    model = Review
    serializer_class = ReviewSerializer


class AdminReviewCreateView(AdminCreateView):
    serializer_class = ReviewSerializer


# ==================== WISHLIST ITEMS ====================
class AdminWishlistItemListView(AdminCRUDView):
    model = WishlistItem
    serializer_class = WishlistItemSerializer
    search_fields = ['user__username', 'product__name']
    ordering = ['-created_at']


class AdminWishlistItemDetailView(AdminDetailView):
    model = WishlistItem
    serializer_class = WishlistItemSerializer


class AdminWishlistItemCreateView(AdminCreateView):
    serializer_class = WishlistItemSerializer


# ==================== SAVED ITEMS ====================
class AdminSavedItemListView(AdminCRUDView):
    model = SavedItem
    serializer_class = SavedItemSerializer
    search_fields = ['user__username', 'product__name']
    ordering = ['-moved_from_cart_at']


class AdminSavedItemDetailView(AdminDetailView):
    model = SavedItem
    serializer_class = SavedItemSerializer


class AdminSavedItemCreateView(AdminCreateView):
    serializer_class = SavedItemSerializer
