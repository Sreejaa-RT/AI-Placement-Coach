import sys
from datasets import load_dataset

try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

ds_cs = load_dataset("CS-Bench/CS-Bench", split="test")

print("=== INSPECTING CS-BENCH COLUMNS & ENGLISH SAMPLES ===")
english_samples = []
for row in ds_cs:
    if row.get("Language") == "en":
        english_samples.append(row)
    if len(english_samples) >= 5:
        break

print(f"Total rows in CS-Bench: {len(ds_cs)}")
print(f"Found {len(english_samples)} English sample rows:")
for idx, row in enumerate(english_samples):
    print(f"\nSample {idx+1}:")
    print(f"  ID: {row.get('ID')}")
    print(f"  Domain: {row.get('Domain')}")
    print(f"  SubDomain: {row.get('SubDomain')}")
    print(f"  Format: {row.get('Format')}")
    print(f"  Question: {row.get('Question')[:200]}...")
    print(f"  Options: A: {row.get('A')} | B: {row.get('B')} | C: {row.get('C')} | D: {row.get('D')}")
    print(f"  Answer: {row.get('Answer')}")
