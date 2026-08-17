import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import joblib

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, classification_report, confusion_matrix
from scipy.sparse import hstack

def plot_confusion_matrix(cm, classes, title, save_path):
    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=classes, yticklabels=classes)
    plt.title(title)
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.tight_layout()
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    plt.savefig(save_path)
    plt.close()
    print(f"Confusion matrix saved to: {save_path}")

def interpret_model(coef, feature_names, classes, model_name):
    print(f"\n==========================================")
    print(f"MODEL INTERPRETABILITY: {model_name}")
    print(f"==========================================")
    print("These represent the model-derived feature weights indicating which features")
    print("strongly drive a classification towards a particular class.")
    
    for i, class_name in enumerate(classes):
        print(f"\nTop 10 features driving classification towards '{class_name}':")
        # Get top indices of sorted coefficients in descending order
        top_indices = coef[i].argsort()[::-1][:10]
        for idx in top_indices:
            print(f"  - {feature_names[idx]:<30} (weight: {coef[i][idx]:.4f})")

def main():
    # Directories
    dataset_dir = "backend/ml/resume_analyzer/dataset"
    models_dir = "backend/ml/resume_analyzer/models"
    results_dir = "backend/ml/resume_analyzer/results/stage3"
    
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(results_dir, exist_ok=True)
    
    # 1. Load Cleaned Datasets
    print("Loading cleaned datasets...")
    train_df = pd.read_csv(os.path.join(dataset_dir, "train_cleaned.csv"))
    test_df = pd.read_csv(os.path.join(dataset_dir, "test_cleaned.csv"))
    
    # Fill NAs if any text processing introduced empty cells
    train_df['cleaned_resume'] = train_df['cleaned_resume'].fillna('')
    train_df['cleaned_jd'] = train_df['cleaned_jd'].fillna('')
    test_df['cleaned_resume'] = test_df['cleaned_resume'].fillna('')
    test_df['cleaned_jd'] = test_df['cleaned_jd'].fillna('')
    
    print(f"Loaded {len(train_df)} training samples and {len(test_df)} testing samples.")
    
    # 2. TF-IDF Feature Engineering
    print("\n--- PHASE 4: TF-IDF FEATURE ENGINEERING ---")
    
    # Initialize separate vectorizers
    # We use: ngram_range=(1,2), max_features=20000, min_df=2, sublinear_tf=True
    resume_vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=20000,
        min_df=2,
        sublinear_tf=True
    )
    
    jd_vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=20000,
        min_df=2,
        sublinear_tf=True
    )
    
    # Fit & Transform ONLY on the training sets
    print("Fitting Resume TF-IDF on training set...")
    X_train_resume = resume_vectorizer.fit_transform(train_df['cleaned_resume'])
    
    print("Fitting Job Description TF-IDF on training set...")
    X_train_jd = jd_vectorizer.fit_transform(train_df['cleaned_jd'])
    
    # Transform ONLY (no fit) on the test sets
    print("Transforming Test Resume & Job Description...")
    X_test_resume = resume_vectorizer.transform(test_df['cleaned_resume'])
    X_test_jd = jd_vectorizer.transform(test_df['cleaned_jd'])
    
    # Vocabulary sizes
    resume_vocab_size = len(resume_vectorizer.vocabulary_)
    jd_vocab_size = len(jd_vectorizer.vocabulary_)
    print(f"Resume TF-IDF vocabulary size: {resume_vocab_size} features")
    print(f"Job Description TF-IDF vocabulary size: {jd_vocab_size} features")
    
    # 3. Concatenate feature matrices
    print("Combining Resume & Job Description representations horizontally...")
    X_train = hstack([X_train_resume, X_train_jd]).tocsr()
    X_test = hstack([X_test_resume, X_test_jd]).tocsr()
    
    print(f"Training feature matrix shape: {X_train.shape}")
    print(f"Test feature matrix shape: {X_test.shape}")
    
    # 4. Target Label Encoding
    # The classes are: No Fit, Potential Fit, Good Fit
    # Let's map them to integers
    label_encoder = LabelEncoder()
    y_train = label_encoder.fit_transform(train_df['label'])
    y_test = label_encoder.transform(test_df['label'])
    
    classes_order = list(label_encoder.classes_)
    print(f"Encoder Class Order mapping: {classes_order}")
    
    # Save the Vectorizers and Label Encoder immediately
    joblib.dump(resume_vectorizer, os.path.join(models_dir, "resume_tfidf_vectorizer.pkl"))
    joblib.dump(jobizer_jd := jd_vectorizer, os.path.join(models_dir, "job_description_tfidf_vectorizer.pkl"))
    joblib.dump(label_encoder, os.path.join(models_dir, "label_encoder.pkl"))
    print("Saved TF-IDF Vectorizers and Label Encoder.")
    
    # 5. Train Supervised ML Models
    print("\n--- PHASE 5: ML MODEL TRAINING ---")
    
    # Model 1: Logistic Regression
    print("Training Model 1: Logistic Regression (class_weight='balanced', max_iter=2000)...")
    lr_model = LogisticRegression(
        class_weight='balanced',
        max_iter=2000,
        random_state=42
    )
    lr_model.fit(X_train, y_train)
    joblib.dump(lr_model, os.path.join(models_dir, "logistic_regression_model.pkl"))
    print("Logistic Regression model trained and saved.")
    
    # Model 2: Linear Support Vector Classifier (Linear SVM)
    print("Training Model 2: Linear SVM (class_weight='balanced', C=1.0, max_iter=5000)...")
    svm_model = LinearSVC(
        class_weight='balanced',
        C=1.0,
        max_iter=5000,
        random_state=42
    )
    svm_model.fit(X_train, y_train)
    joblib.dump(svm_model, os.path.join(models_dir, "linear_svm_model.pkl"))
    print("Linear SVM model trained and saved.")
    
    # 6. Evaluation
    print("\n--- PHASE 6: MODEL EVALUATION & COMPARISON ---")
    
    # Target Evaluation Order: 'No Fit', 'Potential Fit', 'Good Fit'
    evaluation_classes = ['No Fit', 'Potential Fit', 'Good Fit']
    
    models_evaluation = {}
    
    # Logistic Regression Evaluation
    y_pred_lr = lr_model.predict(X_test)
    y_pred_lr_labels = label_encoder.inverse_transform(y_pred_lr)
    
    # Metrics
    acc_lr = accuracy_score(test_df['label'], y_pred_lr_labels)
    prec_lr, rec_lr, f1_lr, _ = precision_recall_fscore_support(
        test_df['label'], y_pred_lr_labels, average='macro', zero_division=0
    )
    _, _, f1_weighted_lr, _ = precision_recall_fscore_support(
        test_df['label'], y_pred_lr_labels, average='weighted', zero_division=0
    )
    
    print("\n[LOGISTIC REGRESSION CLASSIFICATION REPORT]")
    print(classification_report(test_df['label'], y_pred_lr_labels, labels=evaluation_classes))
    
    cm_lr = confusion_matrix(test_df['label'], y_pred_lr_labels, labels=evaluation_classes)
    plot_confusion_matrix(
        cm_lr, evaluation_classes, 
        "Logistic Regression Confusion Matrix", 
        os.path.join(results_dir, "logistic_regression_confusion_matrix.png")
    )
    
    models_evaluation['Logistic Regression'] = {
        'Accuracy': acc_lr,
        'Macro F1': f1_lr,
        'Weighted F1': f1_weighted_lr
    }
    
    # Linear SVM Evaluation
    y_pred_svm = svm_model.predict(X_test)
    y_pred_svm_labels = label_encoder.inverse_transform(y_pred_svm)
    
    # Metrics
    acc_svm = accuracy_score(test_df['label'], y_pred_svm_labels)
    prec_svm, rec_svm, f1_svm, _ = precision_recall_fscore_support(
        test_df['label'], y_pred_svm_labels, average='macro', zero_division=0
    )
    _, _, f1_weighted_svm, _ = precision_recall_fscore_support(
        test_df['label'], y_pred_svm_labels, average='weighted', zero_division=0
    )
    
    print("\n[LINEAR SVM CLASSIFICATION REPORT]")
    print(classification_report(test_df['label'], y_pred_svm_labels, labels=evaluation_classes))
    
    cm_svm = confusion_matrix(test_df['label'], y_pred_svm_labels, labels=evaluation_classes)
    plot_confusion_matrix(
        cm_svm, evaluation_classes, 
        "Linear SVM Confusion Matrix", 
        os.path.join(results_dir, "linear_svm_confusion_matrix.png")
    )
    
    models_evaluation['Linear SVM'] = {
        'Accuracy': acc_svm,
        'Macro F1': f1_svm,
        'Weighted F1': f1_weighted_svm
    }
    
    # 7. Comparison Table
    print("\n--- MODEL COMPARISON TABLE ---")
    comparison_df = pd.DataFrame(models_evaluation).T
    print(comparison_df.to_string())
    
    # Selected Model Determination
    best_model_name = comparison_df['Macro F1'].idxmax()
    print(f"\nSelected Model based on Macro F1: {best_model_name}")
    
    # 8. Model Interpretability
    # Map feature indexes back to their names
    # Prefix them with resume_ or jd_ to distinguish source representation
    resume_features = [f"resume_{name}" for name in resume_vectorizer.get_feature_names_out()]
    jd_features = [f"jd_{name}" for name in jd_vectorizer.get_feature_names_out()]
    all_features = resume_features + jd_features
    
    # In LabelEncoder, classes are stored alphabetically: classes_order
    # Let's inspect weights for each class
    interpret_model(lr_model.coef_, all_features, classes_order, "Logistic Regression")
    interpret_model(svm_model.coef_, all_features, classes_order, "Linear SVM")
    
if __name__ == "__main__":
    main()
