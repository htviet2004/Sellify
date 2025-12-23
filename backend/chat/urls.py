from django.urls import path

from .views import ConversationListView, MessageCreateView

urlpatterns = [
    path("conversations/", ConversationListView.as_view(), name="conversation-list"),
    path("messages/", MessageCreateView.as_view(), name="message-list"),
]
