from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from products.models import Product

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer


class ConversationListView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def get(self, request):
		queryset = self.get_queryset(request)
		serializer = ConversationSerializer(queryset, many=True, context={"request": request})
		return Response({"results": serializer.data})

	def post(self, request):
		if getattr(request.user, "user_type", None) != "buyer":
			raise PermissionDenied("Only buyers can start conversations.")

		product_id = request.data.get("product")
		if not product_id:
			return Response({"product": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)

		product = get_object_or_404(Product, pk=product_id)
		existing = Conversation.objects.filter(
			buyer=request.user,
			shop=product.seller,
			product=product,
		).first()
		if existing:
			return Response(
				{"detail": "Conversation already exists for this product."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		conversation = Conversation.objects.create(
			buyer=request.user,
			shop=product.seller,
			product=product,
		)
		serializer = ConversationSerializer(conversation, context={"request": request})
		return Response(serializer.data, status=status.HTTP_201_CREATED)

	def get_queryset(self, request):
		user = request.user
		base_queryset = (
			Conversation.objects.select_related("buyer", "shop", "product", "shop__profile", "buyer__profile")
			.prefetch_related(
				Prefetch(
					"messages",
					queryset=Message.objects.order_by("-created_at", "-id"),
					to_attr="_prefetched_messages",
				)
			)
		)

		if getattr(user, "user_type", None) == "seller":
			return base_queryset.filter(shop=user).order_by("-created_at")
		if getattr(user, "user_type", None) == "buyer":
			return base_queryset.filter(buyer=user).order_by("-created_at")

		buyer_id = request.query_params.get("buyer")
		shop_id = request.query_params.get("shop")
		if buyer_id:
			base_queryset = base_queryset.filter(buyer_id=buyer_id)
		if shop_id:
			base_queryset = base_queryset.filter(shop_id=shop_id)
		return base_queryset.order_by("-created_at")


class MessageCreateView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def post(self, request):
		conversation_id = request.data.get("conversation")
		content = (request.data.get("content") or "").strip()

		if not conversation_id:
			return Response({"conversation": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)
		if not content:
			return Response({"content": ["This field may not be blank."]}, status=status.HTTP_400_BAD_REQUEST)

		conversation = get_object_or_404(Conversation, pk=conversation_id)
		user = request.user
		user_id = getattr(user, "pk", None)
		if user_id not in {conversation.buyer_id, conversation.shop_id}:
			raise PermissionDenied("You are not allowed to post messages for this conversation.")

		had_messages = conversation.messages.exists()

		message = Message.objects.create(
			conversation=conversation,
			sender=user,
			content=content,
		)
		if not had_messages:
			updated_fields = []
			if user_id == conversation.buyer_id:
				conversation.shop_unread = conversation.shop_unread + 1
				updated_fields.append("shop_unread")
			elif user_id == conversation.shop_id:
				conversation.buyer_unread = conversation.buyer_unread + 1
				updated_fields.append("buyer_unread")
			if updated_fields:
				conversation.save(update_fields=updated_fields)

		serializer = MessageSerializer(message)
		return Response(serializer.data, status=status.HTTP_201_CREATED)
