# chat/consumers.py
import json
from urllib.parse import parse_qs

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.conf import settings
from .models import Conversation, Message
import jwt
from django.db.models import F

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            # --- 1️⃣ Lấy token từ query string ---
            query = parse_qs(self.scope['query_string'].decode())
            token = query.get('token', [None])[0]
            if not token:
                await self.close(code=4401)
                return

            # --- 2️⃣ Giải mã JWT ---
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
                user_id = payload.get('user_id')
                if not user_id:
                    await self.close(code=4401)
                    return
                self.user = await database_sync_to_async(User.objects.get)(user_id=user_id)
            except (jwt.ExpiredSignatureError, jwt.DecodeError, User.DoesNotExist):
                await self.close(code=4401)
                return

            # --- 3️⃣ Lấy shop_id từ URL ---
            self.shop_id = int(self.scope['url_route']['kwargs']['shop_id'])

            # --- 4️⃣ Lấy buyer_id từ query string ---
            buyer_id = query.get('buyer', [None])[0]
            if buyer_id:
                self.buyer_id = int(buyer_id)
            else:
                # Nếu user truy cập là buyer, buyer_id = user.user_id
                self.buyer_id = self.user.user_id

            # --- 5️⃣ Lấy product_id từ query param ---
            product_id = query.get('product', [None])[0]

            # --- 6️⃣ Tạo hoặc lấy conversation ---
            self.conversation = await self.get_or_create_conversation(
                self.buyer_id, self.shop_id, product_id
            )
            if not self.conversation:
                await self.close(code=4403)
                return

            # --- 7️⃣ Kiểm tra quyền truy cập ---
            if self.user.user_id not in (self.conversation.buyer_id, self.conversation.shop_id):
                await self.close(code=4403)
                return

            # --- 8️⃣ Tạo room name & join ---
            self.room_name = f"chat_{self.conversation.id}"
            await self.channel_layer.group_add(self.room_name, self.channel_name)
            await self.accept()

            # --- 9️⃣ Gửi lịch sử tin nhắn ---
            history = await self.get_history(self.conversation.id, 50)
            await self.send(text_data=json.dumps({'type': 'history', 'messages': history}))

            # --- 🔟 Reset unread cho người dùng hiện tại ---
            await self.clear_unread_for_user(self.conversation.id, self.user.user_id)

        except Exception as e:
            print("WS connect exception:", e)
            await self.close(code=4500)

    async def disconnect(self, code):
        if hasattr(self, 'room_name'):
            await self.channel_layer.group_discard(self.room_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return
        try:
            data = json.loads(text_data)
            if (data.get('type') or 'message') == 'message':
                content = (data.get('content') or '').strip()
                if not content:
                    return
                msg, meta = await self.save_message(self.conversation.id, self.user.user_id, content)
                await self.channel_layer.group_send(
                    self.room_name,
                    {'type': 'chat.message', 'message': msg}
                )
                await self.notify_counterpart(meta, msg)
        except Exception as e:
            print("WS receive exception:", e)

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({'type': 'message', 'message': event['message']}))

    async def notify_counterpart(self, meta, message):
        buyer_id = meta.get('buyer_id')
        shop_id = meta.get('shop_id')
        if not buyer_id or not shop_id:
            return

        if self.user.user_id == buyer_id:
            target_id = shop_id
            unread = meta.get('shop_unread', 0)
        else:
            target_id = buyer_id
            unread = meta.get('buyer_unread', 0)

        if not target_id:
            return

        await self.channel_layer.group_send(
            f"user_{target_id}",
            {
                'type': 'chat.summary',
                'payload': {
                    'conversation_id': meta.get('id'),
                    'last_message': message.get('content'),
                    'last_message_at': message.get('created_at'),
                    'unread_count': unread,
                    'sender_id': message.get('sender_id'),
                    'buyer_id': buyer_id,
                    'buyer_name': meta.get('buyer_name'),
                    'shop_id': shop_id,
                    'shop_name': meta.get('shop_name'),
                    'product_id': meta.get('product_id'),
                    'product_name': meta.get('product_name'),
                }
            }
        )

    # ---------------- DB Helpers ----------------
    @database_sync_to_async
    def get_or_create_conversation(self, buyer_id, shop_id, product_id):
        try:
            # Kiểm tra shop có tồn tại
            shop = User.objects.get(user_id=shop_id)
        except User.DoesNotExist:
            return None

        filters = dict(buyer_id=buyer_id, shop_id=shop_id)
        if product_id:
            filters['product_id'] = product_id
        conv, _ = Conversation.objects.get_or_create(**filters)
        return conv

    @database_sync_to_async
    def get_history(self, conv_id, limit):
        qs = Message.objects.filter(conversation_id=conv_id).order_by('-created_at')[:limit]
        return [
            {'id': m.id, 'sender_id': m.sender_id, 'content': m.content, 'created_at': m.created_at.isoformat()}
            for m in reversed(list(qs))
        ]

    @database_sync_to_async
    def save_message(self, conv_id, sender_id, content):
        conversation = (
            Conversation.objects.select_for_update()
            .select_related('buyer', 'shop', 'product')
            .get(id=conv_id)
        )
        m = Message.objects.create(conversation=conversation, sender_id=sender_id, content=content)

        if sender_id == conversation.buyer_id:
            Conversation.objects.filter(id=conv_id).update(shop_unread=F('shop_unread') + 1)
        else:
            Conversation.objects.filter(id=conv_id).update(buyer_unread=F('buyer_unread') + 1)

        conversation.refresh_from_db(fields=['buyer_unread', 'shop_unread'])

        message_payload = {
            'id': m.id,
            'sender_id': m.sender_id,
            'content': m.content,
            'created_at': m.created_at.isoformat(),
            'conversation_id': conversation.id,
        }
        meta = {
            'id': conversation.id,
            'buyer_id': conversation.buyer_id,
            'buyer_name': getattr(conversation.buyer, 'full_name', None) or getattr(conversation.buyer, 'username', ''),
            'shop_id': conversation.shop_id,
            'shop_name': getattr(conversation.shop, 'full_name', None) or getattr(conversation.shop, 'username', ''),
            'product_id': conversation.product_id,
            'product_name': getattr(conversation.product, 'name', None) if conversation.product_id else None,
            'buyer_unread': conversation.buyer_unread,
            'shop_unread': conversation.shop_unread,
        }
        return message_payload, meta

    @database_sync_to_async
    def clear_unread_for_user(self, conv_id, user_id):
        try:
            conversation = Conversation.objects.get(id=conv_id)
        except Conversation.DoesNotExist:
            return
        update_fields = []
        if conversation.buyer_id == user_id and conversation.buyer_unread:
            conversation.buyer_unread = 0
            update_fields.append('buyer_unread')
        if conversation.shop_id == user_id and conversation.shop_unread:
            conversation.shop_unread = 0
            update_fields.append('shop_unread')
        if update_fields:
            conversation.save(update_fields=update_fields)


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            await self.close(code=4401)
            return
        self.user = user
        self.group_name = f"user_{user.user_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def order_status(self, event):
        await self.send(text_data=json.dumps({'type': 'order_status', **event.get('payload', {})}))

    async def chat_summary(self, event):
        await self.send(text_data=json.dumps({'type': 'chat_summary', **event.get('payload', {})}))
