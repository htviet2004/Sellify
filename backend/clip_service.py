"""CLIP utilities: load once, extract image embeddings for similarity search."""
from functools import lru_cache
from typing import List

import torch
from PIL import Image
from transformers import CLIPModel, AutoProcessor


@lru_cache(maxsize=1)
def _load_clip():
    model_name = "openai/clip-vit-base-patch32"
    model = CLIPModel.from_pretrained(model_name, use_safetensors=True)
    processor = AutoProcessor.from_pretrained(model_name)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    model.eval()
    return model, processor, device


def get_image_embedding(image: Image.Image) -> List[float]:
    """Return L2-normalized CLIP image embedding as a list of floats."""
    model, processor, device = _load_clip()
    # Ensure we have a PIL RGB image. Accept numpy arrays or torch tensors too.
    try:
        if isinstance(image, Image.Image):
            image = image.convert("RGB")
        else:
            # try to coerce numpy arrays or torch tensors to PIL Image
            try:
                import numpy as _np
            except Exception:
                _np = None

            if _np is not None and isinstance(image, _np.ndarray):
                # array shape (H,W) or (H,W,3) or (H,W,4)
                if image.ndim == 2:
                    pil_img = Image.fromarray(image.astype('uint8'), mode='L')
                else:
                    pil_img = Image.fromarray(image.astype('uint8'))
                image = pil_img.convert('RGB')
            else:
                # torch tensor -> convert to numpy
                try:
                    import torch as _torch
                    if isinstance(image, _torch.Tensor):
                        arr = image.detach().cpu().numpy()
                        # if (C,H,W) -> (H,W,C)
                        if arr.ndim == 3 and arr.shape[0] in (1,3,4):
                            arr = arr.transpose(1, 2, 0)
                        if arr.dtype != _np.uint8 and _np is not None:
                            arr = (_np.clip(arr, 0, 255)).astype('uint8')
                        image = Image.fromarray(arr)
                        image = image.convert('RGB')
                except Exception:
                    # fallback: leave as-is and let processor report useful error
                    pass
    except Exception:
        # If conversion logic fails, continue and let processor raise a clear error
        pass

    # Build inputs and move tensors to device explicitly
    try:
        # Ensure minimum size to avoid ambiguous channel dimensions
        if hasattr(image, 'size'):
            w, h = image.size
            if w < 10 or h < 10:
                # Resize very small images to minimum 224x224 (CLIP's expected size)
                image = image.resize((max(224, w), max(224, h)), Image.LANCZOS)
        
        inputs = processor(images=[image], return_tensors="pt", padding=True)
        # Move all tensors to device
        inputs = {k: v.to(device) for k, v in inputs.items()}
    except Exception as e:
        # add context about the input to help debugging
        img_type = type(image).__name__
        img_mode = getattr(image, 'mode', None)
        img_size = getattr(image, 'size', None)
        raise RuntimeError(
            f"Failed to preprocess image for CLIP: {e} -- input type={img_type}, mode={img_mode}, size={img_size}"
        )

    with torch.inference_mode():
        feats = model.get_image_features(**inputs)
        # KHÔNG normalize - giống notebook gốc
        # Cosine similarity sẽ được tính trong views.py với L2 normalization

    return feats[0].cpu().tolist()


def get_text_embedding(text: str) -> List[float]:
    """Return CLIP text embedding as a list of floats."""
    model, processor, device = _load_clip()
    
    inputs = processor(text=[text], return_tensors="pt", padding=True)
    inputs = {k: v.to(device) for k, v in inputs.items()}
    
    with torch.inference_mode():
        text_features = model.get_text_features(**inputs)
        # KHÔNG normalize - để views.py xử lý
    
    return text_features[0].cpu().tolist()
