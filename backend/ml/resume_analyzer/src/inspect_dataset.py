import os
import pandas as pd
from datasets import load_dataset

def main():
    print("Loading dataset 'cnamuangtoun/resume-job-description-fit' from Hugging Face...")
    try:
        # Load the dataset
        dataset_dict = load_dataset("cnamuangtoun/resume-job-description-fit")
        print("Dataset loaded successfully!")
        print(f"Available splits: {list(dataset_dict.keys())}")
        
        # Convert splits to pandas DataFrames
        dfs = []
        for split_name in dataset_dict.keys():
            df_split = pd.DataFrame(dataset_dict[split_name])
            df_split['split'] = split_name
            dfs.append(df_split)
        
        # Combine all splits for a global inspection of the dataset
        df = pd.concat(dfs, ignore_index=True)
        
        print("\n--- PHASE 1: DATASET INSPECTION ---")
        
        # 1. Dataset shape
        print(f"1. Dataset Shape (All Splits Combined): {df.shape}")
        for name in dataset_dict.keys():
            print(f"   - Split '{name}' shape: {dataset_dict[name].shape}")
            
        # 2. Column names
        print(f"\n2. Column Names: {list(df.columns)}")
        
        # 3. First 5 records
        print("\n3. First 5 Records:")
        print(df.head(5).to_string())
        
        # 4. Data types
        print("\n4. Data Types:")
        print(df.dtypes.to_string())
        
        # 5. Missing values
        print("\n5. Missing Values (per column):")
        print(df.isnull().sum().to_string())
        
        # 6. Duplicate records (excluding split column)
        cols_to_check = [col for col in df.columns if col != 'split']
        duplicates = df.duplicated(subset=cols_to_check).sum()
        print(f"\n6. Duplicate Records: {duplicates}")
        
        # 7. Number of samples
        print(f"\n7. Number of Samples: {len(df)}")
        
        # 8 & 9. Unique labels & distribution
        # Let's inspect the target column. We assume 'label' or we'll find the candidate column.
        # Let's dynamically find target columns, or check if 'label' exists.
        label_col = 'label' if 'label' in df.columns else None
        if not label_col:
            # Try to guess
            for col in df.columns:
                if col.lower() in ['label', 'target', 'fit', 'class', 'status']:
                    label_col = col
                    break
        
        if label_col:
            print(f"\n8. Target Column Identified: '{label_col}'")
            unique_labels = df[label_col].unique()
            print(f"   Number of Unique Labels: {len(unique_labels)} ({list(unique_labels)})")
            
            print("\n9. Label Distribution:")
            dist = df[label_col].value_counts()
            dist_pct = df[label_col].value_counts(normalize=True) * 100
            for label, count in dist.items():
                print(f"   - {label}: {count} samples ({dist_pct[label]:.2f}%)")
            
            # Check class imbalance
            min_class_pct = dist_pct.min()
            max_class_pct = dist_pct.max()
            imbalance_ratio = max_class_pct / min_class_pct
            print(f"\n   Class Imbalance Check:")
            print(f"   - Max/Min Ratio: {imbalance_ratio:.2f}")
            if imbalance_ratio > 1.5:
                print("   - Warning: The dataset has class imbalance. Class weighting should be used.")
            else:
                print("   - The dataset is relatively balanced.")
        else:
            print("\nWarning: Could not identify target label column automatically.")
            
        # Let's find resume and job description columns
        resume_col = None
        jd_col = None
        for col in df.columns:
            col_lower = col.lower()
            if 'resume' in col_lower or 'cv' in col_lower:
                resume_col = col
            elif 'job' in col_lower or 'jd' in col_lower or 'description' in col_lower:
                jd_col = col
                
        if resume_col:
            print(f"\nResume Text Column: '{resume_col}'")
            # 10. Resume text length statistics (in characters and words)
            lengths_char = df[resume_col].astype(str).str.len()
            lengths_word = df[resume_col].astype(str).str.split().str.len()
            print("10. Resume text length statistics:")
            print("   - Character length stats:")
            print(lengths_char.describe().to_string())
            print("   - Word length stats:")
            print(lengths_word.describe().to_string())
        else:
            print("\nWarning: Could not identify resume text column.")
            
        if jd_col:
            print(f"\nJob Description Column: '{jd_col}'")
            # 11. Job description length statistics (in characters and words)
            lengths_char = df[jd_col].astype(str).str.len()
            lengths_word = df[jd_col].astype(str).str.split().str.len()
            print("11. Job description length statistics:")
            print("   - Character length stats:")
            print(lengths_char.describe().to_string())
            print("   - Word length stats:")
            print(lengths_word.describe().to_string())
        else:
            print("\nWarning: Could not identify job description column.")

    except Exception as e:
        print(f"Error loading or inspecting dataset: {e}")

if __name__ == "__main__":
    main()
