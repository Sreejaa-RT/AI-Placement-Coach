import os
import pandas as pd
from datasets import load_dataset
from .preprocess import clean_text

def main():
    print("Loading original dataset splits...")
    dataset_dict = load_dataset("cnamuangtoun/resume-job-description-fit")
    
    # 1. Keep official splits
    df_train = pd.DataFrame(dataset_dict['train'])
    df_test = pd.DataFrame(dataset_dict['test'])
    
    initial_train_count = len(df_train)
    initial_test_count = len(df_test)
    
    print("\n--- PHASE 2: DUPLICATE & DATA LEAKAGE HANDLING ---")
    
    # Identify training duplicates
    # We use both 'resume_text' and 'job_description_text' as fields to identify exact duplicates.
    duplicate_fields = ['resume_text', 'job_description_text']
    train_duplicates_count = df_train.duplicated(subset=duplicate_fields).sum()
    
    print(f"1. Duplicates check in TRAINING set:")
    print(f"   - Fields used to check: {duplicate_fields}")
    print(f"   - Number of exact duplicates found: {train_duplicates_count}")
    
    # Remove exact duplicates from training set
    if train_duplicates_count > 0:
        df_train = df_train.drop_duplicates(subset=duplicate_fields).reset_index(drop=True)
        print(f"   - Removed {train_duplicates_count} duplicates from training data.")
        print(f"   - New training sample size: {len(df_train)}")
    else:
        print("   - No duplicates found in training data.")
        
    # Check for duplicates in testing set (informational, but don't modify test set size to preserve evaluation baseline)
    test_duplicates_count = df_test.duplicated(subset=duplicate_fields).sum()
    print(f"\n2. Duplicates check in TESTING set (for info only):")
    print(f"   - Number of exact duplicates found: {test_duplicates_count}")
    
    # Check for cross-split duplicates (Data Leakage)
    # A cross-split duplicate means the exact same resume and job description pair exists in both train and test sets.
    # This is a major issue because the test set is no longer completely unseen.
    print(f"\n3. Cross-Split Data Leakage Check:")
    # Create unique keys based on the combination of resume and jd texts
    train_keys = set(zip(df_train['resume_text'], df_train['job_description_text']))
    test_keys = zip(df_test['resume_text'], df_test['job_description_text'])
    
    leakage_count = 0
    for idx, (resume, jd) in enumerate(test_keys):
        if (resume, jd) in train_keys:
            leakage_count += 1
            
    if leakage_count > 0:
        print(f"   - WARNING: Potential Data Leakage Detected!")
        print(f"   - {leakage_count} exact resume-JD pairs in the test set also exist in the training set.")
        print(f"   - These test samples will not be truly 'unseen' during evaluation.")
    else:
        print("   - Success: No exact cross-split duplicates (data leakage) found between train and test splits.")

    print("\n--- PHASE 2: PREPROCESSING ---")
    print("Applying text preprocessing to training and testing sets...")
    
    # Apply clean_text to both resume and job description text
    df_train['cleaned_resume'] = df_train['resume_text'].apply(clean_text)
    df_train['cleaned_jd'] = df_train['job_description_text'].apply(clean_text)
    
    df_test['cleaned_resume'] = df_test['resume_text'].apply(clean_text)
    df_test['cleaned_jd'] = df_test['job_description_text'].apply(clean_text)
    
    print("Preprocessing completed successfully!")

    print("\n--- PHASE 3: TRAIN/TEST HANDLING & VALIDATION ---")
    
    # Print sample counts
    print(f"1. Sample Counts:")
    print(f"   - Train Samples Before Prep: {initial_train_count}")
    print(f"   - Train Samples After Prep (Duplicate Removal): {len(df_train)}")
    print(f"   - Test Samples: {len(df_test)}")
    
    # Print label distribution
    print(f"\n2. Label Distribution in TRAINING Set:")
    train_dist = df_train['label'].value_counts()
    train_pct = df_train['label'].value_counts(normalize=True) * 100
    for label, count in train_dist.items():
        print(f"   - {label}: {count} ({train_pct[label]:.2f}%)")
        
    print(f"\n3. Label Distribution in TESTING Set:")
    test_dist = df_test['label'].value_counts()
    test_pct = df_test['label'].value_counts(normalize=True) * 100
    for label, count in test_dist.items():
        print(f"   - {label}: {count} ({test_pct[label]:.2f}%)")
        
    # Show example of raw vs cleaned text
    print("\n4. Text Cleaning Comparison Example (First training sample):")
    print("\n   [RAW RESUME TEXT (First 150 chars)]:")
    print(f"   \"{df_train['resume_text'].iloc[0][:150]}...\"")
    print("\n   [CLEANED RESUME TEXT (First 150 chars)]:")
    print(f"   \"{df_train['cleaned_resume'].iloc[0][:150]}...\"")
    
    print("\n   [RAW JOB DESCRIPTION (First 150 chars)]:")
    print(f"   \"{df_train['job_description_text'].iloc[0][:150]}...\"")
    print("\n   [CLEANED JOB DESCRIPTION (First 150 chars)]:")
    print(f"   \"{df_train['cleaned_jd'].iloc[0][:150]}...\"")
    
    # Confirmations
    print("\n5. Confirmations:")
    print("   - [CONFIRMED] No TF-IDF transformation has been fitted yet.")
    print("   - [CONFIRMED] The test set has not been used in any capacity for model training or vocabulary building.")
    
    # Save the cleaned datasets
    dataset_dir = "backend/ml/resume_analyzer/dataset"
    os.makedirs(dataset_dir, exist_ok=True)
    
    train_path = os.path.join(dataset_dir, "train_cleaned.csv")
    test_path = os.path.join(dataset_dir, "test_cleaned.csv")
    
    df_train.to_csv(train_path, index=False)
    df_test.to_csv(test_path, index=False)
    
    print(f"\nCleaned datasets saved successfully:")
    print(f" - Train: {train_path}")
    print(f" - Test: {test_path}")

if __name__ == "__main__":
    main()
