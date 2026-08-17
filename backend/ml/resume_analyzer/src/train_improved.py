import os
import json
import joblib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, classification_report, confusion_matrix

from .preprocess import clean_text
from .feature_engineering import SKILLS_VOCAB, extract_engineered_features

def plot_confusion_matrix(cm, classes, title, save_path):
    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Oranges',
                xticklabels=classes, yticklabels=classes)
    plt.title(title)
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.tight_layout()
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    plt.savefig(save_path)
    plt.close()
    print(f"Confusion matrix saved to: {save_path}")

def run_error_analysis(df_test, y_test_labels, y_pred_labels):
    """
    Identifies and prints examples of misclassification for analysis.
    """
    print("\n==========================================")
    print("PHASE 14: ERROR ANALYSIS & MISCLASSIFICATIONS")
    print("==========================================")
    
    # Store indices for specific error types
    errors = {
        "Actual = Good Fit, Predicted = No Fit": [],
        "Actual = No Fit, Predicted = Good Fit": [],
        "Actual = Potential Fit, Predicted = Good Fit": [],
        "Actual = Good Fit, Predicted = Potential Fit": []
    }
    
    for i in range(len(df_test)):
        actual = y_test_labels[i]
        pred = y_pred_labels[i]
        
        if actual == "Good Fit" and pred == "No Fit":
            errors["Actual = Good Fit, Predicted = No Fit"].append(i)
        elif actual == "No Fit" and pred == "Good Fit":
            errors["Actual = No Fit, Predicted = Good Fit"].append(i)
        elif actual == "Potential Fit" and pred == "Good Fit":
            errors["Actual = Potential Fit, Predicted = Good Fit"].append(i)
        elif actual == "Good Fit" and pred == "Potential Fit":
            errors["Actual = Good Fit, Predicted = Potential Fit"].append(i)
            
    for error_type, indices in errors.items():
        print(f"\nError Category: {error_type}")
        if len(indices) == 0:
            print("  No samples found matching this misclassification category.")
            continue
            
        # Select the first example
        idx = indices[0]
        row = df_test.iloc[idx]
        print(f"  Sample index in test set: {idx}")
        print(f"  Resume snippet: \"{row['resume_text'][:120]}...\"")
        print(f"  JD snippet: \"{row['job_description_text'][:120]}...\"")
        print(f"  Cosine Similarity: {row['resume_jd_cosine_similarity']:.4f}")
        print(f"  Skill Match Ratio: {row['skill_match_ratio']:.4f}")
        print(f"  Matched Skills: {row['matched_skills']}")
        print(f"  Missing Skills: {row['missing_skills']}")

def main():
    # Directories
    models_dir = "backend/ml/resume_analyzer/models"
    improved_dir = os.path.join(models_dir, "improved")
    results_dir = "backend/ml/resume_analyzer/results/stage4"
    dataset_dir = "backend/ml/resume_analyzer/dataset"
    
    os.makedirs(improved_dir, exist_ok=True)
    os.makedirs(results_dir, exist_ok=True)
    
    # 1. Load Cleaned Datasets
    print("Loading cleaned datasets...")
    train_df = pd.read_csv(os.path.join(dataset_dir, "train_cleaned.csv"))
    test_df = pd.read_csv(os.path.join(dataset_dir, "test_cleaned.csv"))
    
    print(f"Loaded {len(train_df)} train samples and {len(test_df)} test samples.")
    
    # 2. Load baseline TF-IDF vectorizers & Label Encoder
    print("Loading fitted baseline components for feature engineering...")
    resume_vectorizer = joblib.load(os.path.join(models_dir, "resume_tfidf_vectorizer.pkl"))
    jd_vectorizer = joblib.load(os.path.join(models_dir, "job_description_tfidf_vectorizer.pkl"))
    label_encoder = joblib.load(os.path.join(models_dir, "label_encoder.pkl"))
    
    # 3. Similarity Feature Engineering
    print("\n--- PHASE 10 & 11: FEATURE ENGINEERING ---")
    print("Extracting features from Training set...")
    train_df, X_train = extract_engineered_features(train_df, resume_vectorizer, jd_vectorizer)
    
    print("Extracting features from Testing set...")
    test_df, X_test = extract_engineered_features(test_df, resume_vectorizer, jd_vectorizer)
    
    print(f"Number of engineered features: {X_train.shape[1]}")
    print(f"Feature names: {list(X_train.columns)}")
    print(f"Training feature matrix shape: {X_train.shape}")
    print(f"Testing feature matrix shape: {X_test.shape}")
    
    # Target Encoding
    y_train = label_encoder.transform(train_df['label'])
    y_test = label_encoder.transform(test_df['label'])
    classes_order = list(label_encoder.classes_)
    
    # 4. Train Models
    print("\n--- PHASE 12: TRAINING IMPROVED CLASSIFIERS ---")
    
    # Model A: Logistic Regression
    print("Training Model A: Logistic Regression on matching features...")
    lr_model = LogisticRegression(
        class_weight='balanced',
        max_iter=1000,
        random_state=42
    )
    lr_model.fit(X_train, y_train)
    
    # Model B: Random Forest
    print("Training Model B: Random Forest Classifier (100 estimators)...")
    rf_model = RandomForestClassifier(
        n_estimators=100,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    )
    rf_model.fit(X_train, y_train)
    
    # 5. Evaluation
    print("\n--- PHASE 13: EVALUATION & COMPARISON ---")
    evaluation_classes = ['No Fit', 'Potential Fit', 'Good Fit']
    
    # Eval Logistic Regression
    y_pred_lr = lr_model.predict(X_test)
    y_pred_lr_labels = label_encoder.inverse_transform(y_pred_lr)
    acc_lr = accuracy_score(test_df['label'], y_pred_lr_labels)
    _, _, f1_lr, _ = precision_recall_fscore_support(test_df['label'], y_pred_lr_labels, average='macro', zero_division=0)
    _, _, f1_weighted_lr, _ = precision_recall_fscore_support(test_df['label'], y_pred_lr_labels, average='weighted', zero_division=0)
    
    print("\n[IMPROVED LOGISTIC REGRESSION CLASSIFICATION REPORT]")
    print(classification_report(test_df['label'], y_pred_lr_labels, labels=evaluation_classes))
    
    cm_lr = confusion_matrix(test_df['label'], y_pred_lr_labels, labels=evaluation_classes)
    plot_confusion_matrix(cm_lr, evaluation_classes, "Improved Logistic Regression Confusion Matrix", os.path.join(results_dir, "logistic_regression_confusion_matrix.png"))
    
    # Eval Random Forest
    y_pred_rf = rf_model.predict(X_test)
    y_pred_rf_labels = label_encoder.inverse_transform(y_pred_rf)
    acc_rf = accuracy_score(test_df['label'], y_pred_rf_labels)
    _, _, f1_rf, _ = precision_recall_fscore_support(test_df['label'], y_pred_rf_labels, average='macro', zero_division=0)
    _, _, f1_weighted_rf, _ = precision_recall_fscore_support(test_df['label'], y_pred_rf_labels, average='weighted', zero_division=0)
    
    print("\n[IMPROVED RANDOM FOREST CLASSIFICATION REPORT]")
    print(classification_report(test_df['label'], y_pred_rf_labels, labels=evaluation_classes))
    
    cm_rf = confusion_matrix(test_df['label'], y_pred_rf_labels, labels=evaluation_classes)
    plot_confusion_matrix(cm_rf, evaluation_classes, "Improved Random Forest Confusion Matrix", os.path.join(results_dir, "random_forest_confusion_matrix.png"))
    
    # 6. Comparison Table
    # Stage 3 Baseline scores:
    # Logistic Regression: Accuracy: 48.44%, Macro F1: 44.25%, Weighted F1: 48.06%
    print("\n--- FINAL CLASSIFIER COMPARISON ---")
    comparison_data = [
        {"Approach": "Stage 3 Baseline", "Model": "Logistic Regression", "Accuracy": 0.484366, "Macro F1": 0.442489, "Weighted F1": 0.480597},
        {"Approach": "Stage 4 Improved", "Model": "Logistic Regression", "Accuracy": acc_lr, "Macro F1": f1_lr, "Weighted F1": f1_weighted_lr},
        {"Approach": "Stage 4 Improved", "Model": "Random Forest", "Accuracy": acc_rf, "Macro F1": f1_rf, "Weighted F1": f1_weighted_rf}
    ]
    comparison_df = pd.DataFrame(comparison_data)
    # Format as percentages
    for col in ["Accuracy", "Macro F1", "Weighted F1"]:
        comparison_df[col] = (comparison_df[col] * 100).round(2).astype(str) + "%"
    print(comparison_df.to_string(index=False))
    
    # Select Best Model based on Macro F1
    # Check actual metrics
    best_improved_model_name = "Logistic Regression" if f1_lr >= f1_rf else "Random Forest"
    best_model_obj = lr_model if f1_lr >= f1_rf else rf_model
    print(f"\nSelected Improved Model: {best_improved_model_name}")
    
    # 7. Error Analysis
    # Let's run this for the selected best model predictions
    best_y_pred_labels = y_pred_lr_labels if best_improved_model_name == "Logistic Regression" else y_pred_rf_labels
    run_error_analysis(test_df, test_df['label'].values, best_y_pred_labels)
    
    # 8. Feature Importances
    print("\n==========================================")
    print("PHASE 15: FEATURE IMPORTANCE / ANALYSIS")
    print("==========================================")
    
    feature_names = list(X_train.columns)
    
    # Random Forest Importances
    importances = rf_model.feature_importances_
    rf_imp_df = pd.DataFrame({
        'Feature': feature_names,
        'Importance': importances
    }).sort_values(by='Importance', ascending=False)
    
    print("\n[Random Forest Feature Importance]:")
    print(rf_imp_df.to_string(index=False))
    
    # Logistic Regression coefficients
    print("\n[Logistic Regression Model Coefficients]:")
    # lr_model.coef_ shape is (n_classes, n_features)
    for i, class_name in enumerate(classes_order):
        print(f"Class '{class_name}' coefficients:")
        coef_df = pd.DataFrame({
            'Feature': feature_names,
            'Coefficient': lr_model.coef_[i]
        }).sort_values(by='Coefficient', ascending=False)
        print(coef_df.to_string(index=False))
        print()
        
    # 9. Save Best Improved Model and dependencies
    print("Saving best model and configurations to models/improved/...")
    
    joblib.dump(best_model_obj, os.path.join(improved_dir, "improved_resume_fit_model.pkl"))
    # Save the other models as well for completeness
    joblib.dump(lr_model, os.path.join(improved_dir, "logistic_regression_model.pkl"))
    joblib.dump(rf_model, os.path.join(improved_dir, "random_forest_model.pkl"))
    
    # Save copies of vectorizers and label encoders to the improved directory as requested
    joblib.dump(resume_vectorizer, os.path.join(improved_dir, "resume_tfidf_vectorizer.pkl"))
    joblib.dump(jd_vectorizer, os.path.join(improved_dir, "jd_tfidf_vectorizer.pkl"))
    joblib.dump(label_encoder, os.path.join(improved_dir, "label_encoder.pkl"))
    
    # Save skill vocabulary
    vocab_path = os.path.join(improved_dir, "skill_vocabulary.json")
    with open(vocab_path, 'w') as f:
        json.dump(SKILLS_VOCAB, f, indent=4)
        
    print(f"deliverables successfully saved inside: {improved_dir}")

if __name__ == "__main__":
    main()
