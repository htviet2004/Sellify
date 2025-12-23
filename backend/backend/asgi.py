"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.conf import settings
from urllib.parse import parse_qs

django_asgi_app = get_asgi_application()  # ✅ Load Django apps trước

@database_sync_to_async
def get_user(user_id):
    User = get_user_model()
    return User.objects.get(user_id=user_id)

class JWTAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        # Import TokenBackend sau khi apps đã load
        from rest_framework_simplejwt.backends import TokenBackend
        from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

        scope['user'] = None
        query = parse_qs(scope.get("query_string", b"").decode())
        token = (query.get("token") or [None])[0]

        if token:
            try:
                backend = TokenBackend(algorithm='HS256', signing_key=settings.SECRET_KEY)
                decoded = backend.decode(token, verify=True)
                claim = getattr(settings, 'SIMPLE_JWT', {}).get('USER_ID_CLAIM', 'user_id')
                user_id = decoded.get(claim) or decoded.get('user_id') or decoded.get('id')
                if user_id:
                    scope['user'] = await get_user(user_id)
            except (InvalidToken, TokenError):
                scope['user'] = None

        return await self.inner(scope, receive, send)

from chat.routing import websocket_urlpatterns  # sau get_asgi_application

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        JWTAuthMiddleware(URLRouter(websocket_urlpatterns))
    ),
})
