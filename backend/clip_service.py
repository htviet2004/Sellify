"""CLIP utilities: load once, extract image embeddings for similarity search."""
from functools import lru_cache
from typing import List

import torch
import torch.nn.functional as F
from PIL import Image
from transformers import CLIPModel, CLIPProcessor


@lru_cache(maxsize=1)
def _load_clip():
    model_name = "openai/clip-vit-base-patch32"
    model = CLIPModel.from_pretrained(model_name)
    processor = CLIPProcessor.from_pretrained(model_name)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    model.eval()
    return model, processor, device


def get_image_embedding(image: Image.Image) -> List[float]:
    """Return L2-normalized CLIP image embedding as a list of floats."""
    model, processor, device = _load_clip()
    inputs = processor(images=image, return_tensors="pt").to(device)

    with torch.inference_mode():
        feats = model.get_image_features(**inputs)
        feats = F.normalize(feats, p=2, dim=-1)

    return feats[0].cpu().tolist()
