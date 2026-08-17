import sys
from datasets import load_dataset

try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

print("=== INSPECTING MMLU college_computer_science ===")
# MMLU has 'test', 'validation', and 'dev' splits
for split in ["test", "validation", "dev"]:
    try:
        ds = load_dataset("cais/mmlu", "college_computer_science", split=split)
        print(f"Split: {split} | Size: {len(ds)}")
        # Print some sample questions
        for idx in range(min(5, len(ds))):
            row = ds[idx]
            print(f"  - Q: {row['question'][:150]}...")
            print(f"    Choices: {row['choices']}")
            print(f"    Answer: {row['answer']}")
    except Exception as e:
        print(f"Error loading split {split}: {e}")
