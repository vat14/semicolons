import os
import re

def inplace_replace(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements:
        new_content = re.sub(old, new, new_content)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

# For ml_model.py
ml_reps = [
    (r'SKU_ID', 'Product_ID'),
    (r'_le_sku', '_le_product'),
    (r'SKU_Encoded', 'Product_Encoded'),
    (r'sku_id', 'product_id'),
    (r'sku_enc', 'product_enc'),
    (r'get_available_skus', 'get_available_products'),
    (r'"skus":', '"products":'),
    (r'sku_stats', 'product_stats'),
    (r'SKU\+Warehouse', 'Product+Warehouse'),
    (r'SKU', 'Product'),
]

# For main.py
main_reps = [
    (r'sku_id: str', 'product_id: str'),
    (r'get_available_skus', 'get_available_products'),
    (r'"sku":', '"product_id":'),
    (r'SKU_ID', 'Product_ID'),
    (r'sku_id=', 'product_id='),
    (r'top_10_skus', 'top_10_products'),
    (r'top_skus', 'top_products'),
]

inplace_replace('ml_model.py', ml_reps)
inplace_replace('main.py', main_reps)
print("Backend refactor done.")
