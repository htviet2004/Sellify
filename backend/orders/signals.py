from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.utils import timezone

from .models import Order


@receiver(pre_save, sender=Order)
def store_previous_status(sender, instance, **kwargs):
    """Cache the previous status on the instance so we can compare after save."""
    if not instance.pk:
        instance._previous_status = None  # type: ignore[attr-defined]
        return
    try:
        previous = sender.objects.get(pk=instance.pk)
        instance._previous_status = previous.status  # type: ignore[attr-defined]
    except sender.DoesNotExist:
        instance._previous_status = None  # type: ignore[attr-defined]


@receiver(post_save, sender=Order)
def broadcast_order_status_change(sender, instance, created, **kwargs):
    if created:
        return

    previous_status = getattr(instance, "_previous_status", None)
    if previous_status == instance.status:
        return

    if not instance.user_id:
        return

    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    payload = {
        "order_id": instance.order_id,
        "status": instance.status,
        "status_label": instance.get_status_display(),
        "total_amount": str(instance.total_amount),
        "timestamp": timezone.now().isoformat(),
        "message": f"Đơn hàng #{instance.order_id} đã chuyển sang trạng thái {instance.get_status_display().lower()}.",
    }

    async_to_sync(channel_layer.group_send)(
        f"user_{instance.user_id}",
        {
            "type": "order.status",
            "payload": payload,
        },
    )
