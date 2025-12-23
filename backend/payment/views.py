from datetime import datetime
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from .utils.vnpay import build_query, create_secure_hash, verify_secure_hash

def _client_ip(request):
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "127.0.0.1")

@csrf_exempt
def create_vnpay_payment(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request"}, status=400)

    try:
        data = json.loads(request.body or "{}")
        order_id = str(data.get("order_id") or "").strip()
        amount = float(data.get("amount") or 0)
        if not order_id or amount <= 0:
            return JsonResponse({"error": "order_id/amount không hợp lệ"}, status=400)
    except Exception as e:
        return JsonResponse({"error": f"Invalid data: {e}"}, status=400)

    vnp_params = {
        "vnp_Version": "2.1.0",
        "vnp_Command": "pay",
        "vnp_TmnCode": settings.VNPAY_TMN_CODE,
        "vnp_Amount": str(int(amount * 100)),  # VNPay yêu cầu x100
        "vnp_CurrCode": "VND",
        "vnp_TxnRef": order_id,
        "vnp_OrderInfo": f"Thanh toan don hang #{order_id}",
        "vnp_OrderType": "other",
        "vnp_Locale": "vn",
        "vnp_ReturnUrl": settings.VNPAY_RETURN_URL,
        "vnp_IpAddr": _client_ip(request),
        "vnp_CreateDate": datetime.now().strftime("%Y%m%d%H%M%S"),
    }

    # Tạo chữ ký
    secure_hash = create_secure_hash(settings.VNPAY_HASH_SECRET, vnp_params)
    vnp_params["vnp_SecureHashType"] = "HmacSHA512"
    vnp_params["vnp_SecureHash"] = secure_hash

    payment_url = f"{settings.VNPAY_URL}?{build_query(vnp_params)}"
    return JsonResponse({"payment_url": payment_url})

@csrf_exempt
def vnpay_return(request):
    vnp_data = dict(request.GET.items())
    received_hash = vnp_data.pop("vnp_SecureHash", None)
    vnp_data.pop("vnp_SecureHashType", None)

    if not received_hash:
        return JsonResponse({"status": "fail", "reason": "missing hash"}, status=400)

    verified = verify_secure_hash(settings.VNPAY_HASH_SECRET, vnp_data, received_hash)
    return JsonResponse({
        "verify": verified,
        "order_id": vnp_data.get("vnp_TxnRef"),
        "amount": int(vnp_data.get("vnp_Amount", 0)) / 100,
        "vnp_ResponseCode": vnp_data.get("vnp_ResponseCode"),
    })

@csrf_exempt
def vnpay_ipn(request):
    vnp_data = dict(request.GET.items())
    received_hash = vnp_data.pop("vnp_SecureHash", None)
    vnp_data.pop("vnp_SecureHashType", None)

    if not received_hash:
        return JsonResponse({'RspCode': '99', 'Message': 'Invalid request'})

    if not verify_secure_hash(settings.VNPAY_HASH_SECRET, vnp_data, received_hash):
        return JsonResponse({'RspCode': '97', 'Message': 'Invalid Signature'})

    order_id = vnp_data.get("vnp_TxnRef")
    amount = int(vnp_data.get("vnp_Amount", 0)) / 100
    response_code = vnp_data.get("vnp_ResponseCode")

    # TODO: Kiểm tra order_id trong DB, so sánh amount, update trạng thái
    # Giả lập update thành công
    success = True
    if success:
        return JsonResponse({'RspCode': '00', 'Message': 'Confirm Success'})
    return JsonResponse({'RspCode': '01', 'Message': 'Order not found or invalid'})
