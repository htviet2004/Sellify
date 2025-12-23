from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/payment/", include("payment.urls")),
    path("api/", include("products.urls")),
    path("api/users/", include("users.urls")),
    path("api/auth/", include("users.urls")),
    path("api/orders/", include("orders.urls")),
    path('api/', include('reviews.urls')),
    path('api/chat/', include('chat.urls')),
    path('api/cart/', include('cart.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)