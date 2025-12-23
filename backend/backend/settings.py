"""
Django settings for backend project.
"""

from pathlib import Path
from datetime import timedelta
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-yo_whrj7m1x_%7p^70u4j&^-jsbj&!^xcf)^fr-p-*^+l5ok_g'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['*']  # ⬅️ SỬA: Thêm ['*'] cho development


# Application definition

INSTALLED_APPS = [
    "jazzmin",
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django_extensions',
    
    # Third party apps
    'rest_framework',
    'corsheaders',
    'channels', 
    
    # Local apps
    'products',
    'users',
    'cart',
    'orders',
    'chat',
    'reviews',
]

STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"


MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware', 
    'django.middleware.security.SecurityMiddleware',
    "whitenoise.middleware.WhiteNoiseMiddleware",
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',  # ⬅️ THÊM DÒNG NÀY
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'
ASGI_APPLICATION = 'backend.asgi.application'


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files (for uploaded images, etc.)
MEDIA_URL = '/media/'  # ⬅️ THÊM DÒNG NÀY
MEDIA_ROOT = BASE_DIR / 'media'  # ⬅️ THÊM DÒNG NÀY

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ==================== CUSTOM USER MODEL ====================
AUTH_USER_MODEL = 'users.User'

# ==================== CORS SETTINGS ====================
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

CORS_ALLOW_ALL_ORIGINS = True

# ==================== SESSION & CSRF SETTINGS ====================
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SECURE = False
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://*.trycloudflare.com",  # Cloudflare tunnel URLs
]

# ==================== REST FRAMEWORK SETTINGS ====================
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        # 'rest_framework.authentication.SessionAuthentication',  # có thể bỏ cho API JSON
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',
    ),
}

# ==================== SIMPLE JWT SETTINGS ====================
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',

    'USER_ID_FIELD': 'user_id',
    'USER_ID_CLAIM': 'user_id',

    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'JTI_CLAIM': 'jti',
}

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    }
}
# ==================== VNPAY SETTINGS ====================
VNPAY_TMN_CODE = "77382ZSJ"
VNPAY_HASH_SECRET = "RSEU40X21LAH32U9ZP0N2IY0I3EB8Q26"
VNPAY_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
VNPAY_RETURN_URL = "http://localhost:3000/order-success"


JAZZMIN_SETTINGS = {
    "site_title": "E-Shop PBL6 Admin",
    "site_header": "Quản trị cửa hàng PBL6",
    "site_brand": "PBL6 E-commerce",
    "welcome_sign": "Chào mừng đến với trang quản trị PBL6 💼",
    "copyright": "© 2025 PBL6 Shop",

    # Logo (tuỳ chọn)
    "site_logo": "images/logo.png",  # đường dẫn trong static
    "login_logo": "images/logo.png",
    "login_logo_dark": "images/logo.png",

    "theme": "cosmo",
    "custom_css": "static/css/admin_custom.css",

    # Sidebar menu
    "show_sidebar": True,
    "navigation_expanded": True,

    # Icons cho model (FontAwesome)
    "icons": {
        "auth": "fas fa-users",
        "auth.user": "fas fa-user",
        "auth.Group": "fas fa-users-cog",
        "shop.Product": "fas fa-box",
        "shop.Order": "fas fa-shopping-cart",
        "shop.Customer": "fas fa-user-tie",
    },
}
