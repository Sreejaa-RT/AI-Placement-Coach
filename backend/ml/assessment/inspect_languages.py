import sys
from datasets import load_dataset

try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

ds_cs = load_dataset("CS-Bench/CS-Bench", split="test")

languages = set()
for row in ds_cs:
    languages.add(row.get("Language"))

print("=== Unique Languages in CS-Bench ===")
print(languages)
