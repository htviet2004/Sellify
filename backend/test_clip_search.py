"""
Test script for CLIP text search functionality
Run with: python test_clip_search.py
"""
import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from products.models import Product
from clip_service import get_text_embedding
import torch
import torch.nn.functional as F

def test_clip_search(query, top_k=10):
    """Test CLIP text embedding search"""
    print(f"\n🔍 Testing CLIP search for: '{query}'")
    print("=" * 60)
    
    # Get text embedding
    text_embedding = get_text_embedding(query)
    print(f"✓ Text embedding shape: {text_embedding.shape}")
    
    # Get products with embeddings
    products = Product.objects.exclude(image_embedding__isnull=True).exclude(image_embedding=[])
    print(f"✓ Found {products.count()} products with embeddings")
    
    # Compute similarities
    results = []
    text_tensor = F.normalize(torch.tensor(text_embedding), dim=0)
    
    for product in products:
        try:
            prod_emb = torch.tensor(product.image_embedding)
            prod_tensor = F.normalize(prod_emb, dim=0)
            similarity = torch.dot(text_tensor, prod_tensor).item()
            results.append({
                'id': product.id,
                'name': product.name,
                'category': product.category.name if product.category else 'N/A',
                'similarity': similarity
            })
        except Exception as e:
            print(f"⚠ Error processing product {product.id}: {e}")
    
    # Sort by similarity
    results.sort(key=lambda x: x['similarity'], reverse=True)
    
    # Print top results
    print(f"\n📊 Top {top_k} results:")
    print("-" * 60)
    for i, result in enumerate(results[:top_k], 1):
        print(f"{i}. [{result['similarity']:.4f}] {result['name'][:50]}")
        print(f"   Category: {result['category']}")
    
    return results

if __name__ == "__main__":
    # Test queries
    test_queries = [
        "red dress",
        "blue jeans",
        "sneakers",
        "women's handbag",
        "black jacket"
    ]
    
    print("\n" + "="*60)
    print("CLIP Text Search Test Suite")
    print("="*60)
    
    for query in test_queries:
        test_clip_search(query, top_k=5)
        print()
