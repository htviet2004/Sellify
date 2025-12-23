import hmac
import hashlib
import urllib.parse


def build_query(params: dict) -> str:
    """Build the canonical query string used for VNPay signing.

    - Sort params by key (alphabetical)
    - Skip parameters with empty string values
    - Encode values using quote_plus (spaces -> '+') which matches VNPay examples
    - Do NOT URL-encode the parameter names
    """
    items = sorted((k, '' if v is None else str(v)) for k, v in params.items())
    # Skip empty values
    items = [(k, v) for k, v in items if v != ""]
    return "&".join(f"{k}={urllib.parse.quote_plus(v)}" for k, v in items)


def create_secure_hash(secret_key: str, params: dict) -> str:
    """Create HmacSHA512 signature for given params.

    The signature input must match the canonical string VNPay expects.
    """
    query = build_query(params)
    return hmac.new(secret_key.encode('utf-8'), query.encode('utf-8'), hashlib.sha512).hexdigest()


def verify_secure_hash(secret_key: str, params: dict, received_hash: str) -> bool:
    """Verify VNPay return signature."""
    return create_secure_hash(secret_key, params).lower() == (received_hash or "").lower()
