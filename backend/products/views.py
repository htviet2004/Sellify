from rest_framework import generics, permissions, status, viewsets, mixins, parsers, filters
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from django.db.models import Count, Q
from PIL import Image
import torch

from .serializers import (
    ProductCreateSerializer,
    CategorySerializer,
    ProductSerializer,
    WishlistItemSerializer,
    SavedItemSerializer,
)
from .models import Product, Category, WishlistItem, SavedItem
from clip_service import get_image_embedding, get_text_embedding


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
    - Tính embedding CLIP cho ảnh
    - Trả về các sản phẩm có embedding gần nhất
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

        # Optional ROI support (either as JSON string in 'roi' or separate fields)
        # Expected ROI format (normalized 0..1 or absolute pixels):
        # - roi: JSON string or dict {x, y, w, h} (x,y = top-left)
        # - roi_x, roi_y, roi_w, roi_h: individual values
        try:
            roi = None
            if 'roi' in request.data:
                raw = request.data.get('roi')
                if isinstance(raw, str):
                    import json
                    try:
                        roi = json.loads(raw)
                    except Exception:
                        roi = None
                elif isinstance(raw, dict):
                    roi = raw

            if roi is None:
                x = request.data.get('roi_x')
                y = request.data.get('roi_y')
                w = request.data.get('roi_w')
                h = request.data.get('roi_h')
                if x is not None and y is not None and w is not None and h is not None:
                    try:
                        roi = {'x': float(x), 'y': float(y), 'w': float(w), 'h': float(h)}
                    except Exception:
                        roi = None

            # Keep original full image for full-image embedding
            original_img = img.copy()

            roi_crop = None
            if roi:
                iw, ih = original_img.size
                rx = float(roi.get('x', 0))
                ry = float(roi.get('y', 0))
                rw = float(roi.get('w', 0))
                rh = float(roi.get('h', 0))
                # detect normalized vs absolute: if values <=1 treat as normalized
                if 0 <= rx <= 1 and 0 <= ry <= 1 and 0 <= rw <= 1 and 0 <= rh <= 1:
                    left = int(rx * iw)
                    upper = int(ry * ih)
                    right = int((rx + rw) * iw)
                    lower = int((ry + rh) * ih)
                else:
                    left = int(rx)
                    upper = int(ry)
                    right = int(rx + rw)
                    lower = int(ry + rh)

                # clamp to image bounds and ensure minimum ROI size (at least 10x10)
                left = max(0, min(left, iw - 1))
                upper = max(0, min(upper, ih - 1))
                right = max(left + 10, min(right, iw))
                lower = max(upper + 10, min(lower, ih))

                try:
                    roi_crop = original_img.crop((left, upper, right, lower))
                    # Validate ROI size
                    if roi_crop.size[0] < 10 or roi_crop.size[1] < 10:
                        roi_crop = None  # Ignore too-small ROI
                except Exception:
                    roi_crop = None

        except Exception:
            roi = None

        try:
            # Compute full-image embedding
            full_embedding = get_image_embedding(original_img)
            if not full_embedding:
                return Response({"error": "Could not compute full image embedding"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            full_tensor = torch.tensor(full_embedding, dtype=torch.float32).view(-1)
            if full_tensor.numel() == 0:
                return Response({"error": "Empty full image embedding"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Compute ROI embedding if provided
            roi_tensor = None
            if roi_crop is not None:
                roi_embedding = get_image_embedding(roi_crop)
                if roi_embedding:
                    roi_tensor = torch.tensor(roi_embedding, dtype=torch.float32).view(-1)

            # L2-normalize tensors
            def l2_normalize(tensor: torch.Tensor):
                norm = torch.norm(tensor)
                if norm.numel() == 0 or norm == 0:
                    return tensor
                return tensor / norm

            full_tensor = l2_normalize(full_tensor)
            if roi_tensor is not None:
                roi_tensor = l2_normalize(roi_tensor)

            # Fuse embeddings: prefer ROI as close-up
            if roi_tensor is not None:
                final_tensor = 0.8 * roi_tensor + 0.2 * full_tensor
                final_tensor = l2_normalize(final_tensor)
            else:
                final_tensor = full_tensor

            # Retrieve candidates and compute cosine similarity
            k = int(request.query_params.get('k', 50))
            candidates = Product.objects.filter(is_active=True).exclude(image_embedding__isnull=True)
            scored = []
            for p in candidates.select_related('seller', 'category'):
                emb = p.image_embedding
                if not emb:
                    continue
                try:
                    prod_tensor = torch.tensor(emb, dtype=torch.float32).view(-1)
                    if prod_tensor.numel() != final_tensor.numel():
                        continue
                    prod_tensor = l2_normalize(prod_tensor)
                    score = float(torch.dot(final_tensor, prod_tensor).item())
                    scored.append((score, p))
                except Exception:
                    continue

            scored.sort(key=lambda x: x[0], reverse=True)
            top = scored[:k]

            results = []
            for score, p in top:
                results.append({
                    "id": p.id,
                    "name": p.name,
                    "price": str(p.price),
                    "image": (p.image.url if p.image else (p.image_url or None)),
                    "category": p.category.name if p.category else None,
                    "seller": p.seller.username if p.seller else None,
                    "similarity": score,
                })

            return Response({
                "total_results": len(results),
                "results": results,
            })

        except Exception as e:
            return Response({"error": f"Image search failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            try:
                original_img.close()
            except Exception:
                pass
            try:
                if roi_crop is not None:
                    roi_crop.close()
            except Exception:
                pass


class TextSearchView(APIView):
    """Search products using CLIP text embedding"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response({"error": "Query text required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get text embedding
            text_embedding = get_text_embedding(query)
            text_tensor = torch.tensor(text_embedding, dtype=torch.float32).view(-1)
            
            # L2 normalize
            def l2_normalize(tensor: torch.Tensor):
                norm = torch.norm(tensor)
                if norm.numel() == 0 or norm == 0:
                    return tensor
                return tensor / norm
            
            text_tensor = l2_normalize(text_tensor)
            
            # Search products
            k = int(request.query_params.get('k', 50))
            candidates = Product.objects.filter(is_active=True).exclude(image_embedding__isnull=True)
            scored = []
            
            for p in candidates.select_related('seller', 'category'):
                emb = p.image_embedding
                if not emb:
                    continue
                try:
                    prod_tensor = torch.tensor(emb, dtype=torch.float32).view(-1)
                    if prod_tensor.numel() != text_tensor.numel():
                        continue
                    prod_tensor = l2_normalize(prod_tensor)
                    score = float(torch.dot(text_tensor, prod_tensor).item())
                    scored.append((score, p))
                except Exception:
                    continue
            
            scored.sort(key=lambda x: x[0], reverse=True)
            top = scored[:k]
            
            results = []
            for score, p in top:
                results.append({
                    "id": p.id,
                    "name": p.name,
                    "price": str(p.price),
                    "stock": p.stock,
                    "image": (p.image.url if p.image else (p.image_url or None)),
                    "category": p.category.name if p.category else None,
                    "seller": p.seller.username if p.seller else None,
                    "similarity": score,
                })
            
            return Response({
                "query": query,
                "total_results": len(results),
                "results": results,
            })
            
        except Exception as e:
            return Response({"error": f"Text search failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
