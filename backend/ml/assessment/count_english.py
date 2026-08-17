import sys
from datasets import load_dataset

try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

ds_cs = load_dataset("CS-Bench/CS-Bench", split="test")

domains = {}
subdomains = {}
english_count = 0

for row in ds_cs:
    if row.get("Language") == "English":
        english_count += 1
        d = row.get("Domain")
        sd = row.get("SubDomain")
        domains[d] = domains.get(d, 0) + 1
        subdomains[sd] = subdomains.get(sd, 0) + 1

print(f"Total English questions in CS-Bench: {english_count}")
print("\nDomain Counts:")
for d, c in domains.items():
    print(f"  - {d}: {c}")

print("\nSubDomain Counts:")
for sd, c in subdomains.items():
    print(f"  - {sd}: {c}")
