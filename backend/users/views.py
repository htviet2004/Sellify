from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q, Count

from .serializers import UserSerializer

from .models import User, Profile
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    LoginSerializer,
    ChangePasswordSerializer,
    UpdateUserSerializer,
    UserListSerializer,
    ProfileSerializer
)


# ==================== AUTHENTICATION VIEWS ====================

class RegisterView(generics.CreateAPIView):
    """
    API đăng ký user mới
    
    POST /api/users/register/
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Tạo JWT token cho user mới
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'message': 'User registered successfully',
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """
    API đăng nhập
    """
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def post(self, request):
        try:
            # Validate input
            serializer = LoginSerializer(data=request.data)
            
            if not serializer.is_valid():
                print(f"❌ Validation errors: {serializer.errors}")
                return Response(
                    {'error': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            
            print(f"🔐 Attempting login for: {username}")
            
            # Authenticate user
            user = authenticate(request, username=username, password=password)
            
            if not user:
                print(f"❌ Authentication failed for: {username}")
                return Response(
                    {'error': 'Invalid username or password'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            print(f"✅ User authenticated: {user.username}")
            print(f"   User ID: {user.user_id}")
            print(f"   User PK: {user.pk}")
            print(f"   Is active: {user.is_active}")
            print(f"   Status: {user.status}")
            
            # Check if user is active
            if not user.is_active:
                print(f"⚠️ User not active")
                return Response(
                    {'error': 'Account is disabled. Please contact support.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check user status
            if user.status != 'active':
                print(f"⚠️ User status is: {user.status}")
                return Response(
                    {'error': f'Account is {user.status}. Please contact support.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Generate JWT tokens
            print("🎟️ Generating JWT tokens...")
            
            try:
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)
                
                print(f"✅ Tokens generated successfully")
                print(f"   Access token: {access_token[:50]}...")
                print(f"   Refresh token: {refresh_token[:50]}...")
                
            except Exception as token_error:
                print(f"❌ Token generation error: {str(token_error)}")
                print(f"   Error type: {type(token_error).__name__}")
                print(f"   Traceback: {traceback.format_exc()}")
                return Response(
                    {
                        'error': 'Error generating authentication tokens',
                        'details': str(token_error)
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Serialize user data
            try:
                user_data = UserSerializer(user).data
            except Exception as serializer_error:
                print(f"❌ User serialization error: {str(serializer_error)}")
                user_data = {
                    'user_id': user.user_id,
                    'username': user.username,
                    'email': user.email,
                    'user_type': user.user_type,
                }
            
            response_data = {
                'user': user_data,
                'message': 'Login successful',
                'tokens': {
                    'access': access_token,
                    'refresh': refresh_token,
                }
            }
            
            print(f"✅ Login successful for: {user.username}")
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Unexpected error in LoginView: {str(e)}")
            print(f"   Error type: {type(e).__name__}")
            print(f"   Traceback: {traceback.format_exc()}")
            return Response(
                {
                    'error': 'An unexpected error occurred',
                    'details': str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LogoutView(APIView):
    """
    API đăng xuất (Blacklist refresh token)
    
    POST /api/users/logout/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'error': 'Refresh token is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            return Response(
                {'message': 'Logout successful'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


# ==================== USER MANAGEMENT VIEWS ====================

class UserDetailView(generics.RetrieveUpdateAPIView):
    """
    API lấy và cập nhật thông tin user hiện tại
    
    GET /api/users/me/
    PUT/PATCH /api/users/me/
    """
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UpdateUserSerializer
        return UserSerializer
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response({
            'user': UserSerializer(instance).data,
            'message': 'Profile updated successfully'
        })


class ChangePasswordView(APIView):
    """
    API đổi mật khẩu
    
    POST /api/users/change-password/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        # Set new password
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)


class DeleteAccountView(APIView):
    """
    API xóa tài khoản (soft delete - set status='inactive')
    
    DELETE /api/users/me/
    """
    permission_classes = [IsAuthenticated]
    
    def delete(self, request):
        user = request.user
        user.status = 'inactive'
        user.is_active = False
        user.save()
        
        return Response({
            'message': 'Account deactivated successfully'
        }, status=status.HTTP_200_OK)


# ==================== ADMIN VIEWS ====================

class UserListView(generics.ListAPIView):
    """
    API lấy danh sách tất cả user (Admin only)
    
    GET /api/users/?user_type=buyer&status=active
    """
    queryset = User.objects.all()
    serializer_class = UserListSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by user_type
        user_type = self.request.query_params.get('user_type', None)
        if user_type:
            queryset = queryset.filter(user_type=user_type)
        
        # Filter by status
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Search by username or email
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                username__icontains=search
            ) | queryset.filter(
                email__icontains=search
            )
        
        return queryset.order_by('-created_at')


class UserManageView(generics.RetrieveUpdateDestroyAPIView):
    """
    API quản lý user cụ thể (Admin only)
    
    GET /api/users/<user_id>/
    PUT/PATCH /api/users/<user_id>/
    DELETE /api/users/<user_id>/
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    lookup_field = 'user_id'
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Không cho phép admin tự xóa chính mình
        if instance == request.user:
            return Response(
                {'error': 'Cannot delete your own account'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Soft delete
        instance.status = 'inactive'
        instance.is_active = False
        instance.save()
        
        return Response({
            'message': 'User deactivated successfully'
        }, status=status.HTTP_200_OK)


class UserStatusUpdateView(APIView):
    """
    API cập nhật trạng thái user (Admin only)
    
    POST /api/users/<user_id>/status/
    """
    permission_classes = [IsAdminUser]
    
    def post(self, request, user_id):
        user = get_object_or_404(User, user_id=user_id)
        
        new_status = request.data.get('status')
        
        if new_status not in ['active', 'inactive', 'suspended']:
            return Response(
                {'error': 'Invalid status. Must be: active, inactive, or suspended'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Không cho phép admin tự suspend chính mình
        if user == request.user and new_status != 'active':
            return Response(
                {'error': 'Cannot suspend your own account'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.status = new_status
        user.is_active = (new_status == 'active')
        user.save()
        
        return Response({
            'user': UserSerializer(user).data,
            'message': f'User status updated to {new_status}'
        }, status=status.HTTP_200_OK)


# ==================== PROFILE VIEWS ====================

class ProfileView(generics.RetrieveUpdateAPIView):
    """
    API lấy và cập nhật profile
    
    GET /api/users/profile/
    PUT/PATCH /api/users/profile/
    """
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        # Tạo profile nếu chưa có
        profile, created = Profile.objects.get_or_create(user=self.request.user)
        return profile

    def update(self, request, *args, **kwargs):
        profile_instance = self.get_object()
        user_instance = request.user

        payload = {}
        if 'full_name' in request.data:
            payload['full_name'] = request.data.get('full_name')
        if 'phone' in request.data:
            payload['phone'] = request.data.get('phone')

        profile_data = request.data.get('profile', {})
        if isinstance(profile_data, dict) and profile_data:
            payload['profile'] = profile_data

        serializer = UpdateUserSerializer(
            user_instance,
            data=payload,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        profile_instance.refresh_from_db()
        
        # Check if profile is completed (all required fields filled)
        # For sellers: require bio (shop description)
        if user_instance.user_type == 'seller':
            is_completed = all([
                user_instance.full_name,
                user_instance.phone,
                profile_instance.bio,  # Required for sellers
                profile_instance.address,
                profile_instance.city,
                profile_instance.district,
                profile_instance.ward,
            ])
        else:
            # For buyers: bio is optional
            is_completed = all([
                user_instance.full_name,
                user_instance.phone,
                profile_instance.address,
                profile_instance.city,
                profile_instance.district,
                profile_instance.ward,
            ])
        
        # Update profile_completed flag
        if is_completed and not user_instance.profile_completed:
            user_instance.profile_completed = True
            user_instance.save()

        return Response(
            {
                'message': 'Cập nhật hồ sơ thành công',
                'user': UserSerializer(user_instance).data,
                'profile': ProfileSerializer(profile_instance, context={'request': request}).data,
            },
            status=status.HTTP_200_OK,
        )
    
    # Note: update is implemented above to handle updating both User and Profile.
    # The simpler serializer-based update was removed to ensure full_name/phone
    # are updated together with nested profile data.


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_avatar(request):
    """
    API upload avatar
    
    POST /api/users/profile/avatar/
    """
    try:
        profile, created = Profile.objects.get_or_create(user=request.user)
        
        if 'avatar' not in request.FILES:
            return Response(
                {'error': 'No avatar file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        avatar_file = request.FILES['avatar']
        
        # Validate file size (5MB max)
        if avatar_file.size > 5 * 1024 * 1024:
            return Response(
                {'error': 'File size exceeds 5MB limit'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file type
        if not avatar_file.content_type.startswith('image/'):
            return Response(
                {'error': 'Invalid file type. Only images are allowed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Save avatar
        profile.avatar = avatar_file
        profile.save()
        
        return Response({
            'message': 'Avatar uploaded successfully',
            'avatar_url': request.build_absolute_uri(profile.avatar.url) if profile.avatar else None
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==================== STATISTICS VIEWS (Admin) ====================

class UserStatisticsView(APIView):
    """
    API thống kê user (Admin only)
    
    GET /api/users/statistics/
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        total_users = User.objects.count()
        active_users = User.objects.filter(status='active').count()
        inactive_users = User.objects.filter(status='inactive').count()
        suspended_users = User.objects.filter(status='suspended').count()
        
        buyers = User.objects.filter(user_type='buyer').count()
        sellers = User.objects.filter(user_type='seller').count()
        admins = User.objects.filter(user_type='admin').count()
        
        return Response({
            'total_users': total_users,
            'by_status': {
                'active': active_users,
                'inactive': inactive_users,
                'suspended': suspended_users,
            },
            'by_type': {
                'buyers': buyers,
                'sellers': sellers,
                'admins': admins,
            }
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """
    GET /api/users/me/ -> thông tin user đang auth
    """
    serializer = UserSerializer(request.user, context={'request': request})
    return Response(serializer.data)


# ============================================
# SHOP VIEWS (THÊM VÀO CUỐI FILE)
# ============================================

@api_view(['GET'])
@permission_classes([AllowAny])
def get_all_shops(request):
    """
    Lấy danh sách tất cả seller shops
    
    GET /api/users/shops/
    Query params:
    - search: tìm kiếm theo tên, username, bio
    - sort: newest, oldest, popular, rating
    """
    try:
        # Lấy tất cả seller đang active
        shops = User.objects.filter(
            user_type='seller',
            status='active',
            is_active=True
        )
        
        # Search
        search = request.GET.get('search', '').strip()
        if search:
            shops = shops.filter(
                Q(username__icontains=search) |
                Q(full_name__icontains=search) |
                Q(profile__bio__icontains=search)
            )
        
        # Sorting
        sort_by = request.GET.get('sort', 'newest')
        if sort_by == 'newest':
            shops = shops.order_by('-created_at')
        elif sort_by == 'oldest':
            shops = shops.order_by('created_at')
        elif sort_by == 'popular':
            # Sort by number of products (descending)
            from products.models import Product
            shops = shops.annotate(
                product_count=Count('product')
            ).order_by('-product_count')
        
        # Serialize
        from .serializers import SellerPublicSerializer
        serializer = SellerPublicSerializer(
            shops,
            many=True,
            context={'request': request}
        )
        
        return Response({
            'success': True,
            'count': shops.count(),
            'results': serializer.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Error in get_all_shops: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def seller_shop_profile(request, seller_id):
    """
    Lấy thông tin shop của seller và danh sách sản phẩm
    
    GET /api/users/shop/<seller_id>/
    Query params:
    - search: tìm sản phẩm trong shop
    - category: lọc theo category
    - min_price, max_price: lọc theo giá
    - sort: newest, oldest, price_low, price_high, name
    """
    try:
        # Lấy seller
        seller = get_object_or_404(
            User,
            user_id=seller_id,
            user_type='seller',
            status='active'
        )
        
        # Serialize seller info
        from .serializers import SellerPublicSerializer
        seller_serializer = SellerPublicSerializer(
            seller,
            context={'request': request}
        )
        
        # Lấy products của seller
        from products.models import Product
        from products.serializers import ProductSerializer
        
        products = Product.objects.filter(
            seller=seller,
            is_active=True
        )
        
        # Filters
        search = request.GET.get('search', '').strip()
        if search:
            products = products.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
        
        category = request.GET.get('category')
        if category:
            products = products.filter(category_id=category)
        
        min_price = request.GET.get('min_price')
        if min_price:
            products = products.filter(price__gte=min_price)
        
        max_price = request.GET.get('max_price')
        if max_price:
            products = products.filter(price__lte=max_price)
        
        # Sorting
        sort_by = request.GET.get('sort', 'newest')
        if sort_by == 'newest':
            products = products.order_by('-created_at')
        elif sort_by == 'oldest':
            products = products.order_by('created_at')
        elif sort_by == 'price_low':
            products = products.order_by('price')
        elif sort_by == 'price_high':
            products = products.order_by('-price')
        elif sort_by == 'name':
            products = products.order_by('name')
        
        # Serialize products
        products_serializer = ProductSerializer(
            products,
            many=True,
            context={'request': request}
        )
        
        return Response({
            'success': True,
            'seller': seller_serializer.data,
            'products': {
                'count': products.count(),
                'results': products_serializer.data,
            }
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response(
            {'error': 'Shop không tồn tại'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print(f"Error in seller_shop_profile: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def shop_statistics(request, seller_id):
    """
    Thống kê công khai của shop
    
    GET /api/users/shop/<seller_id>/stats/
    """
    try:
        seller = get_object_or_404(
            User,
            user_id=seller_id,
            user_type='seller'
        )
        
        from products.models import Product
        from orders.models import OrderItem
        
        # Products stats
        total_products = Product.objects.filter(seller=seller).count()
        active_products = Product.objects.filter(
            seller=seller,
            is_active=True
        ).count()
        
        # Orders stats
        total_sales = OrderItem.objects.filter(
            product__seller=seller,
            order__status='completed'
        ).count()
        
        # Recent products
        recent_products = Product.objects.filter(
            seller=seller,
            is_active=True
        ).order_by('-created_at')[:5]
        
        from products.serializers import ProductSerializer
        recent_products_data = ProductSerializer(
            recent_products,
            many=True,
            context={'request': request}
        ).data
        
        return Response({
            'success': True,
            'stats': {
                'total_products': total_products,
                'active_products': active_products,
                'total_sales': total_sales,
                'rating': 4.8,  # TODO: Calculate from reviews
            },
            'recent_products': recent_products_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
