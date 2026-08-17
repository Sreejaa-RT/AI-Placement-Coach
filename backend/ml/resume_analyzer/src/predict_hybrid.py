import os
import json
import joblib
import pandas as pd
import numpy as np
from scipy.sparse import hstack, csr_matrix

from .preprocess import clean_text
from .feature_engineering import extract_engineered_features

HYBRID_MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models", "hybrid")

_resume_vectorizer = None
_jd_vectorizer = None
_label_encoder = None
_scaler = None
_hybrid_model = None
_skill_vocab = None

def load_hybrid_models():
    """
    Loads and caches the hybrid model files from the 'hybrid/' directory.
    """
    global _resume_vectorizer, _jd_vectorizer, _label_encoder, _scaler, _hybrid_model, _skill_vocab
    
    if _hybrid_model is None:
        try:
            print("Loading hybrid models and preprocessing assets from models/hybrid/...")
            _resume_vectorizer = joblib.load(os.path.join(HYBRID_MODELS_DIR, "resume_tfidf_vectorizer.pkl"))
            _jd_vectorizer = joblib.load(os.path.join(HYBRID_MODELS_DIR, "jd_tfidf_vectorizer.pkl"))
            _label_encoder = joblib.load(os.path.join(HYBRID_MODELS_DIR, "label_encoder.pkl"))
            _scaler = joblib.load(os.path.join(HYBRID_MODELS_DIR, "feature_scaler.pkl"))
            _hybrid_model = joblib.load(os.path.join(HYBRID_MODELS_DIR, "hybrid_logistic_regression_model.pkl"))
            
            with open(os.path.join(HYBRID_MODELS_DIR, "skill_vocabulary.json"), 'r') as f:
                _skill_vocab = json.load(f)
                
            print("Hybrid model assets loaded successfully!")
        except Exception as e:
            raise IOError(f"Error loading hybrid model deliverables: {e}. Please run train_hybrid.py first.")

def predict_fit_hybrid(resume_text, job_description):
    """
    Accepts raw resume text and job description, cleans them, extracts hybrid features,
    applies fitted scaler/vectorizer transformations, and runs prediction.
    """
    # 1. Load models
    load_hybrid_models()
    
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
    
    # 4. Extract engineered features
    # This also populates the columns in row_df (matched_skills, missing_skills, cosine_sim, etc.)
    _, eng_features = extract_engineered_features(row_df, _resume_vectorizer, _jd_vectorizer)
    
    # Get values from extracted row
    cosine_sim = float(row_df['resume_jd_cosine_similarity'].iloc[0])
    keyword_overlap = float(row_df['keyword_overlap_ratio'].iloc[0])
    skill_match_ratio = float(row_df['skill_match_ratio'].iloc[0])
    matched_skills = row_df['matched_skills'].iloc[0]
    missing_skills = row_df['missing_skills'].iloc[0]
    
    # 5. Apply TF-IDF transforms
    X_resume = _resume_vectorizer.transform([cleaned_resume])
    X_jd = _jd_vectorizer.transform([cleaned_jd])
    X_tfidf = hstack([X_resume, X_jd]).tocsr()
    
    # 6. Scale matching features
    X_eng_scaled = _scaler.transform(eng_features)
    
    # 7. Concatenate into hybrid feature vector
    X_hybrid = hstack([X_tfidf, csr_matrix(X_eng_scaled)]).tocsr()
    
    # 8. Model prediction
    pred_encoded = _hybrid_model.predict(X_hybrid)[0]
    predicted_label = _label_encoder.inverse_transform([pred_encoded])[0]
    
    # Extract probabilities
    class_probs = {}
    if hasattr(_hybrid_model, "predict_proba"):
        probabilities = _hybrid_model.predict_proba(X_hybrid)[0]
        for class_name, prob in zip(_label_encoder.classes_, probabilities):
            class_probs[class_name] = float(prob)
            
    return {
        "predicted_label": predicted_label,
        "class_probabilities": class_probs,
        "cosine_similarity": cosine_sim,
        "keyword_overlap": keyword_overlap,
        "skill_match_ratio": skill_match_ratio,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills
    }

def main():
    # Example inputs
    example_resume = (
        "John Doe\n"
        "Senior Developer with 6 years experience.\n"
        "Skills: Python, SQL, C++, Git, Docker, Machine Learning.\n"
        "Experience in software engineering, database normalization, and model deployment."
    )
    
    example_jd = (
        "Role: Senior Software Engineer / Python Specialist\n"
        "Requirements:\n"
        "- High proficiency in Python and database architectures (SQL).\n"
        "- Exposure to C++ and Git version control.\n"
        "- Knowledge of containerization (Docker) and ML methodologies is a plus."
    )
    
    print("\n--- Example Hybrid Prediction: Matching Candidate ---")
    try:
        result = predict_fit_hybrid(example_resume, example_jd)
        print("\nPrediction Output:")
        print(f"Predicted Fit: {result['predicted_label']}")
        print("Confidence Probabilities:")
        for class_name, prob in result['class_probabilities'].items():
            print(f"  - {class_name}: {prob:.4f}")
        print(f"Cosine Similarity: {result['cosine_similarity']:.4f}")
        print(f"Keyword Overlap Ratio: {result['keyword_overlap']:.4f}")
        print(f"Skill Match Ratio: {result['skill_match_ratio']:.4f}")
        print(f"Matched Skills: {result['matched_skills']}")
        print(f"Missing Skills: {result['missing_skills']}")
    except Exception as e:
        print(f"Prediction failed: {e}")
        
    mismatch_resume = (
        "Jane Smith\n"
        "Clerical Accountant with experience in bookkeeping, tax filings, and Excel data entry."
    )
    
    print("\n--- Example Hybrid Prediction: Mismatch Candidate ---")
    try:
        result_mis = predict_fit_hybrid(mismatch_resume, example_jd)
        print("\nPrediction Output:")
        print(f"Predicted Fit: {result_mis['predicted_label']}")
        print("Confidence Probabilities:")
        for class_name, prob in result_mis['class_probabilities'].items():
            print(f"  - {class_name}: {prob:.4f}")
        print(f"Cosine Similarity: {result_mis['cosine_similarity']:.4f}")
        print(f"Keyword Overlap Ratio: {result_mis['keyword_overlap']:.4f}")
        print(f"Skill Match Ratio: {result_mis['skill_match_ratio']:.4f}")
        print(f"Matched Skills: {result_mis['matched_skills']}")
        print(f"Missing Skills: {result_mis['missing_skills']}")
    except Exception as e:
        print(f"Prediction failed: {e}")

if __name__ == "__main__":
    main()
