from rest_framework import serializers
from .models import Review

class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ('id', 'product', 'user', 'user_name', 'rating', 'comment', 'created_at')
        read_only_fields = ('user', 'product', 'created_at')

    def get_user_name(self, obj):
        u = obj.user
        return getattr(u, 'full_name', None) or getattr(u, 'name', None) or u.get_full_name() or u.get_username()