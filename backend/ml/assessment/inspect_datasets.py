import os
from datasets import load_dataset, get_dataset_config_names

print("=" * 60)
print("INSPECTING DATASETS")
print("=" * 60)

# 1. Inspect MMLU
print("\n[MMLU] Loading configuration names...")
try:
    configs = get_dataset_config_names("cais/mmlu")
    print(f"MMLU configs count: {len(configs)}")
    
    # Target configurations we identified
    target_configs = ["computer_science", "elementary_mathematics", "college_mathematics", "formal_logic", "english_grammar"]
    
    for config in target_configs:
        if config in configs:
            print(f"\nLoading MMLU configuration: {config}...")
            # Load a small validation split or dev split to inspect
            ds = load_dataset("cais/mmlu", config, split="validation")
            print(f"Split: validation | Size: {len(ds)}")
            print("Columns:", ds.column_names)
            print("Features:", ds.features)
            print("Sample row:")
            print(ds[0])
        else:
            print(f"Config '{config}' not found in MMLU!")
except Exception as e:
    print(f"Error loading MMLU: {e}")

# 2. Inspect CS-Bench
print("\n" + "=" * 60)
print("[CS-Bench] Loading configuration/dataset...")
try:
    # CS-Bench might have multiple configs or a default one
    configs_cs = get_dataset_config_names("CS-Bench/CS-Bench")
    print(f"CS-Bench configs count: {len(configs_cs)}")
    print("Configs:", configs_cs)
    
    # Load first configuration split to inspect
    if len(configs_cs) > 0:
        ds_cs = load_dataset("CS-Bench/CS-Bench", configs_cs[0], split="test")
        print(f"\nSplit: test (first config) | Size: {len(ds_cs)}")
        print("Columns:", ds_cs.column_names)
        print("Features:", ds_cs.features)
        print("Sample row:")
        print(ds_cs[0])
    else:
        ds_cs = load_dataset("CS-Bench/CS-Bench", split="test")
        print(f"\nSplit: test (default) | Size: {len(ds_cs)}")
        print("Columns:", ds_cs.column_names)
        print("Features:", ds_cs.features)
        print("Sample row:")
        print(ds_cs[0])
except Exception as e:
    print(f"Error loading CS-Bench: {e}")
