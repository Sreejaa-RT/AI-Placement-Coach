import sys
from datasets import get_dataset_config_names

configs = get_dataset_config_names("cais/mmlu")
with open("backend/ml/assessment/mmlu_configs.txt", "w", encoding="utf-8") as f:
    for name in sorted(configs):
        f.write(name + "\n")

print(f"Saved {len(configs)} configuration names to mmlu_configs.txt")
