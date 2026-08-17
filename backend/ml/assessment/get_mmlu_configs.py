import sys
import os
from datasets import get_dataset_config_names

# Ensure stdout handles unicode printing correctly on Windows
try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

configs = get_dataset_config_names("cais/mmlu")
print("=== All MMLU Config Names ===")
for name in sorted(configs):
    if "computer" in name or "math" in name or "logic" in name or "english" in name or "grammar" in name or "verbal" in name:
        print(f"Match: {name}")
