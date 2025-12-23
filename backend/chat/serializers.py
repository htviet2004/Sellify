from rest_framework import serializers

from .models import Conversation, Message


class ConversationAdminSerializer(serializers.ModelSerializer):
    """Simple serializer for admin CRUD - no complex lookups"""
    buyer_username = serializers.CharField(source='buyer.username', read_only=True)
    shop_username = serializers.CharField(source='shop.username', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True, allow_null=True)
    
    class Meta:
        model = Conversation
        fields = ['id', 'buyer', 'buyer_username', 'shop', 'shop_username', 
                  'product', 'product_name', 'created_at', 'buyer_unread', 'shop_unread']
        read_only_fields = ['id', 'buyer_username', 'shop_username', 'product_name', 'created_at']


class MessageAdminSerializer(serializers.ModelSerializer):
    """Simple serializer for admin CRUD"""
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_username', 'content', 'created_at']
        read_only_fields = ['id', 'sender_username', 'created_at']


class ConversationSerializer(serializers.ModelSerializer):
    shop_name = serializers.SerializerMethodField()
    shop_avatar = serializers.SerializerMethodField()
    buyer_name = serializers.SerializerMethodField()
    product_name = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    last_message_at = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = (
            "id",
            "shop_id",
            "shop_name",
            "shop_avatar",
            "buyer_id",
            "buyer_name",
            "product_id",
            "product_name",
            "last_message",
            "last_message_at",
            "unread_count",
        )

    def get_shop_name(self, obj):
        if hasattr(obj, "shop") and obj.shop:
            return obj.shop.full_name or obj.shop.username
        return ""

    def get_shop_avatar(self, obj):
        profile = getattr(obj.shop, "profile", None)
        if profile and profile.avatar:
            request = self.context.get("request")
            return request.build_absolute_uri(profile.avatar.url) if request else profile.avatar.url
        return None

    def get_buyer_name(self, obj):
        if hasattr(obj, "buyer") and obj.buyer:
            return obj.buyer.full_name or obj.buyer.username
        return ""

    def get_product_name(self, obj):
        if hasattr(obj, "product") and obj.product:
            return obj.product.name
        return None

    def _get_last_message(self, obj):
        prefetched = getattr(obj, "_prefetched_messages", None)
        if prefetched:
            return prefetched[0]
        return obj.messages.order_by("-created_at", "-id").first()

    def get_last_message(self, obj):
        msg = self._get_last_message(obj)
        return msg.content if msg else ""

    def get_last_message_at(self, obj):
        msg = self._get_last_message(obj)
        if msg:
            return msg.created_at
        return obj.created_at

    def get_unread_count(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if user and getattr(user, "is_authenticated", False):
            user_id = getattr(user, "pk", None)
            if obj.buyer_id == user_id:
                return obj.buyer_unread
            if obj.shop_id == user_id:
                return obj.shop_unread
        viewer = self.context.get("viewer")
        if viewer == "buyer":
            return obj.buyer_unread
        if viewer == "seller":
            return obj.shop_unread
        return obj.buyer_unread + obj.shop_unread


class MessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(source="sender.id", read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "conversation",
            "sender_id",
            "content",
            "created_at",
        ]
        read_only_fields = ["id", "sender_id", "created_at"]
