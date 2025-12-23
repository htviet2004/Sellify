from django.db.models import Avg, Count, Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .models import Review
from products.models import Product
from orders.models import OrderItem, Order
from .serializers import ReviewSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication

PURCHASED_STATUSES = ['paid', 'completed', 'delivered', 'shipping']  # chỉnh theo trạng thái thực tế

def _get_product_or_404(product_id):
    try:
        return Product.objects.get(pk=product_id)
    except Product.DoesNotExist:
        from rest_framework.exceptions import NotFound
        raise NotFound('Product not found')

def _purchase_status_q():
    q = Q()
    # Tự dò field tồn tại để tránh FieldError
    try:
        Order._meta.get_field('status')
        q |= Q(order__status__in=PURCHASED_STATUSES)
    except Exception:
        pass
    try:
        Order._meta.get_field('payment_status')
        q |= Q(order__payment_status__in=['paid', 'completed'])
    except Exception:
        pass
    try:
        Order._meta.get_field('is_paid')
        q |= Q(order__is_paid=True)
    except Exception:
        pass
    return q

class ProductReviewsView(APIView):
    authentication_classes = (JWTAuthentication,)   # ⬅️ ép dùng JWT (GET vẫn AllowAny ok)
    permission_classes = [permissions.AllowAny]

    def get(self, request, product_id):
        product = _get_product_or_404(product_id)
        qs = Review.objects.filter(product=product).select_related('user').order_by('-created_at')
        data = ReviewSerializer(qs, many=True).data
        agg = qs.aggregate(average=Avg('rating'), count=Count('id'))
        return Response({
            'reviews': data,
            'average': round(agg['average'] or 0, 2),
            'count': agg['count'] or 0
        })

    def post(self, request, product_id):
        if not request.user or not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

        product = _get_product_or_404(product_id)
        try:
            rating = int(request.data.get('rating') or 0)
        except Exception:
            rating = 0
        comment = (request.data.get('comment') or '').strip()

        if rating < 1 or rating > 5:
            return Response({'detail': 'Rating must be 1-5'}, status=status.HTTP_400_BAD_REQUEST)

        base_qs = OrderItem.objects.filter(product_id=product.pk, order__user=request.user)
        status_q = _purchase_status_q()
        purchased = base_qs.filter(status_q).exists() if status_q else base_qs.exists()

        if not purchased:
            return Response({'detail': 'Chỉ người đã mua sản phẩm mới có thể đánh giá.'},
                            status=status.HTTP_403_FORBIDDEN)

        # Use update_or_create to avoid NOT NULL constraint error on rating
        review, _created = Review.objects.update_or_create(
            product=product,
            user=request.user,
            defaults={'rating': rating, 'comment': comment}
        )

        ser = ReviewSerializer(review)
        return Response(ser.data, status=status.HTTP_201_CREATED)

class ProductReviewEligibilityView(APIView):
    authentication_classes = (JWTAuthentication,)
    permission_classes = [permissions.AllowAny]

    def get(self, request, product_id):
        product = _get_product_or_404(product_id)

        if not request.user or not request.user.is_authenticated:
            return Response({'can_review': False, 'reason': 'unauthenticated'})

        base_qs = OrderItem.objects.filter(product_id=product.pk, order__user=request.user)
        status_q = _purchase_status_q()
        purchased = base_qs.filter(status_q).exists() if status_q else base_qs.exists()

        my_review = Review.objects.filter(product=product, user=request.user).first()
        payload = {
            'can_review': bool(purchased and not my_review),
        }
        if my_review:
            payload['my_review'] = {
                'id': my_review.pk,
                'rating': my_review.rating,
                'comment': my_review.comment,
                'created_at': my_review.created_at,
            }
        return Response(payload, status=200)