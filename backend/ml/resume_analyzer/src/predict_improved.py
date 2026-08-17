import os
import json
import joblib
import pandas as pd
import numpy as np
from scipy.sparse import hstack

from .preprocess import clean_text
from .feature_engineering import extract_engineered_features, get_skill_counts_and_matches

IMPROVED_MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models", "improved")

_resume_vectorizer = None
_jd_vectorizer = None
_label_encoder = None
_improved_model = None
_skill_vocab = None

def load_improved_models():
    """
    Loads and caches the improved model files from the 'improved/' directory.
    """
    global _resume_vectorizer, _jd_vectorizer, _label_encoder, _improved_model, _skill_vocab
    
    if _improved_model is None:
        try:
            print("Loading improved models and vectorizers from models/improved/...")
            _resume_vectorizer = joblib.load(os.path.join(IMPROVED_MODELS_DIR, "resume_tfidf_vectorizer.pkl"))
            _jd_vectorizer = joblib.load(os.path.join(IMPROVED_MODELS_DIR, "jd_tfidf_vectorizer.pkl"))
            _label_encoder = joblib.load(os.path.join(IMPROVED_MODELS_DIR, "label_encoder.pkl"))
            _improved_model = joblib.load(os.path.join(IMPROVED_MODELS_DIR, "improved_resume_fit_model.pkl"))
            
            with open(os.path.join(IMPROVED_MODELS_DIR, "skill_vocabulary.json"), 'r') as f:
                _skill_vocab = json.load(f)
                
            print("Improved model deliverables loaded successfully!")
        except Exception as e:
            raise IOError(f"Error loading improved model deliverables: {e}. Please run train_improved.py first.")

def predict_fit_improved(resume_text, job_description):
    """
    Accepts raw resume text and job description, extracts matching and similarity features,
    and returns predictions and match metadata.
    """
    # 1. Ensure models are loaded
    load_improved_models()
    
    # 2. Preprocess text
    cleaned_resume = clean_text(resume_text)
    cleaned_jd = clean_text(job_description)
    
    # 3. Build a single-row dataframe for feature extraction
    row_df = pd.DataFrame({
        'cleaned_resume': [cleaned_resume],
        'cleaned_jd': [cleaned_jd],
        'resume_text': [resume_text],
        'job_description_text': [job_description]
    })
    
    # 4. Extract engineered features using identical pipeline
    _, feature_matrix = extract_engineered_features(row_df, _resume_vectorizer, _jd_vectorizer)
    
    # Get values from extracted row
    cosine_sim = float(row_df['resume_jd_cosine_similarity'].iloc[0])
    skill_match_ratio = float(row_df['skill_match_ratio'].iloc[0])
    matched_skills = row_df['matched_skills'].iloc[0]
    missing_skills = row_df['missing_skills'].iloc[0]
    
    # 5. Model prediction
    pred_encoded = _improved_model.predict(feature_matrix)[0]
    predicted_label = _label_encoder.inverse_transform([pred_encoded])[0]
    
    # Extract probabilities if supported (Logistic Regression supports it)
    class_probs = {}
    if hasattr(_improved_model, "predict_proba"):
        probabilities = _improved_model.predict_proba(feature_matrix)[0]
        for class_name, prob in zip(_label_encoder.classes_, probabilities):
            class_probs[class_name] = float(prob)
            
    return {
        "predicted_label": predicted_label,
        "class_probabilities": class_probs,
        "cosine_similarity": cosine_sim,
        "skill_match_ratio": skill_match_ratio,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills
    }

def main():
    # Example inputs
    example_resume = (
        "Candidate Profile:\n"
        "Proficient in Python programming and SQL query optimization. "
        "Experienced in using Pandas, NumPy, and Scikit-learn for building regression and classification models. "
        "Familiar with Git and cloud workflows on AWS."
    )
    
    example_jd = (
        "Wanted: Data Analyst / Machine Learning Specialist\n"
        "Requirements:\n"
        "- Experience writing queries in SQL and developing scripts in Python.\n"
        "- Hands-on experience with Pandas, NumPy, and Scikit-learn.\n"
        "- Exposure to AWS Cloud services is a plus."
    )
    
    print("\n--- Example Prediction: Matching Candidate ---")
    
    try:
        result = predict_fit_improved(example_resume, example_jd)
        print("\nPrediction Output:")
        print(f"Predicted Fit: {result['predicted_label']}")
        if result['class_probabilities']:
            print("Confidence Probabilities:")
            for class_name, prob in result['class_probabilities'].items():
                print(f"  - {class_name}: {prob:.4f}")
        print(f"Cosine Similarity: {result['cosine_similarity']:.4f}")
        print(f"Skill Match Ratio: {result['skill_match_ratio']:.4f}")
        print(f"Matched Skills: {result['matched_skills']}")
        print(f"Missing Skills: {result['missing_skills']}")
        
    except Exception as e:
        print(f"Prediction failed: {e}")

if __name__ == "__main__":
    main()
