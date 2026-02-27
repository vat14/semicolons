import os
import re
import glob

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

# For React UI components and Data files
frontend_reps = [
    (r'\bskus\b', 'products'),
    (r'\bSKUs\b', 'Products'),
    (r'sku_id', 'product_id'),
    (r'sku1', 'product1'),
    (r'sku2', 'product2'),
    (r'\bsku\b', 'product_id'),  # specifically for data keys like item.sku -> item.product_id
    (r'"sku"', '"product_id"'),
    (r'SKU_ID', 'Product_ID'),
    (r'\bSKU\b', 'Product ID'),
    (r'Top 10 Revenue Product IDs', 'Top 10 Revenue Products'),
    (r'Top Stockout Risk Product IDs', 'Top Stockout Risk Products'),
    (r'Fast-Moving Product IDs', 'Fast-Moving Products'),
    (r'Slow-Moving Product IDs', 'Slow-Moving Products'),
    (r'`\$\{h\.product_id\}', '`${h.product_id}'),
    (r'd\.product_id === product1', 'd.product_id === product1'),
    (r'get_available_skus', 'get_available_products')
]

files = glob.glob(r'c:\Users\vatsa\Desktop\semicolons\src\**\*.jsx', recursive=True) + glob.glob(r'c:\Users\vatsa\Desktop\semicolons\src\**\*.js', recursive=True)
for fpath in files:
    inplace_replace(fpath, frontend_reps)

print("Frontend refactor done.")
