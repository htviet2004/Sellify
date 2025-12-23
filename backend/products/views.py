from rest_framework import generics, permissions, status, viewsets, mixins, parsers, filters
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from django.db.models import Count, Q
from PIL import Image

from .serializers import (
    ProductCreateSerializer,
    CategorySerializer,
    ProductSerializer,
    WishlistItemSerializer,
    SavedItemSerializer,
)
from .models import Product, Category, WishlistItem, SavedItem
from resnet_service import classify_image


class BuyerOnlyPermission(permissions.BasePermission):
    message = 'Chức năng này chỉ dành cho người mua.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'user_type', None) == 'buyer'
        )

class ProductViewSet(viewsets.ModelViewSet):
    """CRUD sản phẩm với filter/search"""
    queryset = Product.objects.select_related('seller', 'category').all()
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'price', 'name']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProductCreateSerializer
        return ProductSerializer

    def get_queryset(self):
        queryset = Product.objects.select_related('seller', 'category').all()
        
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        seller_id = self.request.query_params.get('seller')
        if seller_id:
            queryset = queryset.filter(seller_id=seller_id)
        
        stock_status = self.request.query_params.get('stock_status')
        if stock_status == 'in_stock':
            queryset = queryset.filter(stock__gt=0)
        elif stock_status == 'out_of_stock':
            queryset = queryset.filter(stock=0)
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(description__icontains=search))
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    def perform_update(self, serializer):
        product = self.get_object()
        if product.seller != self.request.user:
            raise PermissionDenied("Bạn chỉ có thể chỉnh sửa sản phẩm của mình")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.seller != self.request.user:
            raise PermissionDenied("Bạn chỉ có thể xóa sản phẩm của mình")
        instance.delete()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        product = serializer.instance
        output_serializer = ProductSerializer(product, context={'request': request})
        return Response({'message': 'Tạo sản phẩm thành công!', 'product': output_serializer.data},
                        status=status.HTTP_201_CREATED)

class CategoryViewSet(viewsets.ModelViewSet):
    """CRUD danh mục"""
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Category.objects.all()
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        # Thêm product_count nếu muốn
        queryset = queryset.annotate(product_count=Count("products", filter=Q(products__is_active=True)))
        return queryset


class ImageSearchView(APIView):
    """
    Tìm kiếm sản phẩm bằng ảnh sử dụng ResNet classification
    
    POST /api/search/image/
    - Nhận file ảnh
    - Classify ảnh thành 1 trong 18 class
    - Trả về các sản phẩm trong category tương ứng
    """
    parser_classes = [MultiPartParser]
    permission_classes = [AllowAny]

    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response(
                {"error": "No file uploaded"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            img = Image.open(file).convert("RGB")
        except Exception as e:
            return Response(
                {"error": f"Cannot open image: {e}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Phân loại ảnh
            predicted_class = classify_image(img)
            
            # Tìm sản phẩm có category tương ứng
            # Chuyển đổi class name thành category name (ví dụ: 'backpack' -> 'Backpack')
            category_name = predicted_class.capitalize()
            
            # Tìm category
            category = Category.objects.filter(name__iexact=category_name).first()
            
            if category:
                # Lấy sản phẩm trong category này
                products = Product.objects.filter(
                    category=category,
                    is_active=True
                ).select_related('seller', 'category')[:50]  # Giới hạn 50 sản phẩm
                
                results = []
                for p in products:
                    results.append({
                        "id": p.id,
                        "name": p.name,
                        "price": str(p.price),
                        "image": (p.image.url if p.image else (p.image_url or None)),
                        "category": category_name,
                        "seller": p.seller.username if p.seller else None,
                    })
            else:
                # Nếu không tìm thấy category chính xác, tìm gần đúng
                products = Product.objects.filter(
                    Q(name__icontains=predicted_class) | 
                    Q(description__icontains=predicted_class),
                    is_active=True
                ).select_related('seller', 'category')[:50]
                
                results = []
                for p in products:
                    results.append({
                        "id": p.id,
                        "name": p.name,
                        "price": str(p.price),
                        "image": (p.image.url if p.image else (p.image_url or None)),
                        "category": p.category.name if p.category else None,
                        "seller": p.seller.username if p.seller else None,
                    })
            
            return Response({
                "predicted_class": predicted_class,
                "category": category_name,
                "total_results": len(results),
                "results": results
            })
            
        except Exception as e:
            return Response(
                {"error": f"Classification failed: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        finally:
            try:
                img.close()
            except Exception:
                pass


class WishlistViewSet(mixins.ListModelMixin,
                      mixins.CreateModelMixin,
                      mixins.DestroyModelMixin,
                      mixins.RetrieveModelMixin,
                      viewsets.GenericViewSet):
    serializer_class = WishlistItemSerializer
    permission_classes = [IsAuthenticated, BuyerOnlyPermission]

    def get_queryset(self):
        return WishlistItem.objects.filter(user=self.request.user)\
            .select_related('product', 'product__category', 'product__seller')\
            .order_by('-created_at')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data
        product = validated.get('product')
        if not product:
            return Response({'detail': 'product_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        color = (validated.get('color') or '').strip()
        size = (validated.get('size') or '').strip()
        note = validated.get('note', '')

        instance, created = WishlistItem.objects.get_or_create(
            user=request.user,
            product=product,
            color=color,
            size=size,
            defaults={'note': note},
        )
        if not created and note:
            instance.note = note
            instance.save(update_fields=['note', 'updated_at'])
        return Response(self.get_serializer(instance).data,
                        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.user != request.user:
            raise PermissionDenied('Not allowed to modify this wishlist item.')
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SavedItemViewSet(mixins.ListModelMixin,
                       mixins.CreateModelMixin,
                       mixins.UpdateModelMixin,
                       mixins.DestroyModelMixin,
                       viewsets.GenericViewSet):
    serializer_class = SavedItemSerializer
    permission_classes = [IsAuthenticated, BuyerOnlyPermission]

    def get_queryset(self):
        return SavedItem.objects.filter(user=self.request.user)\
            .select_related('product', 'product__category', 'product__seller')\
            .order_by('-moved_from_cart_at')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data
        product = validated.get('product')
        if not product:
            return Response({'detail': 'product_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        color = (validated.get('color') or '').strip()
        size = (validated.get('size') or '').strip()
        quantity = validated.get('quantity') or 1

        if product.stock is not None:
            if quantity > product.stock:
                return Response(
                    {'quantity': ['Quantity exceeds available stock.']},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        instance = SavedItem.objects.filter(
            user=request.user,
            product=product,
            color=color,
            size=size,
        ).first()

        if instance:
            new_quantity = instance.quantity + quantity
            if product.stock is not None and new_quantity > product.stock:
                return Response(
                    {'quantity': ['Quantity exceeds available stock.']},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            instance.quantity = new_quantity
            instance.save(update_fields=['quantity', 'updated_at'])
            status_code = status.HTTP_200_OK
        else:
            instance = SavedItem.objects.create(
                user=request.user,
                product=product,
                color=color,
                size=size,
                quantity=quantity,
            )
            status_code = status.HTTP_201_CREATED

        return Response(self.get_serializer(instance).data, status=status_code)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.user != request.user:
            raise PermissionDenied('Not allowed to modify this saved item.')
        quantity = request.data.get('quantity')
        if quantity is None:
            return Response({'detail': 'quantity is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return Response({'detail': 'quantity must be an integer'}, status=status.HTTP_400_BAD_REQUEST)
        if quantity < 1:
            return Response({'quantity': ['Quantity must be at least 1.']}, status=status.HTTP_400_BAD_REQUEST)
        if instance.product.stock is not None and quantity > instance.product.stock:
            return Response({'quantity': ['Quantity exceeds available stock.']}, status=status.HTTP_400_BAD_REQUEST)
        instance.quantity = quantity
        instance.save(update_fields=['quantity', 'updated_at'])
        return Response(self.get_serializer(instance).data)

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.user != request.user:
            raise PermissionDenied('Not allowed to modify this saved item.')
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def seller_products(request):
    products = Product.objects.filter(seller=request.user).select_related('category').order_by('-created_at')
    serializer = ProductSerializer(products, many=True, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def seller_stats(request):
    products = Product.objects.filter(seller=request.user)
    stats = {
        'total': products.count(),
        'active': products.filter(is_active=True).count(),
        'inactive': products.filter(is_active=False).count(),
        'outOfStock': products.filter(stock=0).count(),
    }
    return Response(stats, status=status.HTTP_200_OK)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def toggle_product_status(request, pk):
    try:
        product = Product.objects.get(pk=pk)
        if product.seller != request.user:
            return Response({'error': 'Bạn không có quyền chỉnh sửa sản phẩm này'},
                            status=status.HTTP_403_FORBIDDEN)
        new_status = request.data.get('is_active')
        if new_status is not None:
            product.is_active = new_status
        else:
            product.is_active = not product.is_active
        product.save()
        serializer = ProductSerializer(product, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Product.DoesNotExist:
        return Response({'error': 'Không tìm thấy sản phẩm'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def seller_product_detail(request, pk):
    try:
        product = Product.objects.select_related('category').get(pk=pk)
        if product.seller != request.user:
            return Response({'error': 'Bạn không có quyền truy cập sản phẩm này'},
                            status=status.HTTP_403_FORBIDDEN)
        if request.method == 'GET':
            serializer = ProductSerializer(product, context={'request': request})
            return Response(serializer.data)
        elif request.method in ['PUT', 'PATCH']:
            partial = request.method == 'PATCH'
            serializer = ProductCreateSerializer(product, data=request.data, partial=partial, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                output_serializer = ProductSerializer(serializer.instance, context={'request': request})
                return Response({'success': True, 'message': 'Cập nhật sản phẩm thành công', 'product': output_serializer.data})
            return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        elif request.method == 'DELETE':
            name = product.name
            product.delete()
            return Response({'success': True, 'message': f'Đã xóa sản phẩm "{name}"'})
    except Product.DoesNotExist:
        return Response({'error': 'Không tìm thấy sản phẩm'}, status=status.HTTP_404_NOT_FOUND)
