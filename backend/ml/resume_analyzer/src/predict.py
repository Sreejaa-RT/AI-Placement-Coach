import os
import joblib
import pandas as pd
from scipy.sparse import hstack

# Import cleaning function from local preprocess module
from .preprocess import clean_text

# Paths
MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")

# Global variables for caching loaded models/vectorizers
_resume_vectorizer = None
_jd_vectorizer = None
_label_encoder = None
_selected_model = None

def load_models():
    """
    Loads and caches the model files to avoid reloading them on multiple calls.
    """
    global _resume_vectorizer, _jd_vectorizer, _label_encoder, _selected_model
    
    if _selected_model is None:
        try:
            resume_vectorizer_path = os.path.join(MODELS_DIR, "resume_tfidf_vectorizer.pkl")
            jd_vectorizer_path = os.path.join(MODELS_DIR, "job_description_tfidf_vectorizer.pkl")
            label_encoder_path = os.path.join(MODELS_DIR, "label_encoder.pkl")
            model_path = os.path.join(MODELS_DIR, "logistic_regression_model.pkl") # Selected model
            
            print("Loading models and vectorizers from disk...")
            _resume_vectorizer = joblib.load(resume_vectorizer_path)
            _jd_vectorizer = joblib.load(jd_vectorizer_path)
            _label_encoder = joblib.load(label_encoder_path)
            _selected_model = joblib.load(model_path)
            print("Models loaded successfully!")
        except Exception as e:
            raise IOError(f"Error loading model files: {e}. Please run train.py first.")

def predict_fit(resume_text, job_description):
    """
    Accepts raw resume text and job description, cleans them, applies TF-IDF transforms,
    combines them, and makes a prediction using the trained Logistic Regression model.
    """
    # 1. Ensure models are loaded
    load_models()
    
    # 2. Preprocess raw text using the identical pipeline
    cleaned_resume = clean_text(resume_text)
    cleaned_jd = clean_text(job_description)
    
    # 3. Vectorize text (transform only!)
    X_resume = _resume_vectorizer.transform([cleaned_resume])
    X_jd = _jd_vectorizer.transform([cleaned_jd])
    
    # 4. Concatenate feature representation horizontally
    X_combined = hstack([X_resume, X_jd]).tocsr()
    
    # 5. Predict class label
    pred_encoded = _selected_model.predict(X_combined)[0]
    predicted_label = _label_encoder.inverse_transform([pred_encoded])[0]
    
    # 6. Extract probabilities for each class
    # Logistic Regression supports predict_proba. Classes are mapped alphabetically.
    # e.g., ['Good Fit', 'No Fit', 'Potential Fit']
    probabilities = _selected_model.predict_proba(X_combined)[0]
    class_probs = {}
    for class_name, prob in zip(_label_encoder.classes_, probabilities):
        class_probs[class_name] = float(prob)
        
    return {
        "predicted_label": predicted_label,
        "class_probabilities": class_probs
    }

def main():
    # Example raw inputs
    example_resume = (
        "John Doe\n"
        "Senior Software Engineer with 6 years of experience.\n"
        "Skills: Python, SQL, C++, Git, Docker, Machine Learning.\n"
        "Experience: Built microservices and API endpoints with Flask. "
        "Developed and deployed regression and classification models for client classification."
    )
    
    example_jd = (
        "Role: Senior Software Developer\n"
        "Requirements:\n"
        "- Strong experience in Python development.\n"
        "- Familiarity with C++ and relational databases (SQL).\n"
        "- Experience with Git version control and software architecture.\n"
        "- Able to work in hybrid environment."
    )
    
    print("\n--- Example Prediction 1: Good Match Candidate ---")
    print(f"Resume snippet: \"{example_resume[:120]}...\"")
    print(f"JD snippet: \"{example_jd[:120]}...\"")
    
    try:
        result = predict_fit(example_resume, example_jd)
        print("\nPrediction Output:")
        print(f"Predicted Fit: {result['predicted_label']}")
        print("Confidence Probabilities:")
        for class_name, prob in result['class_probabilities'].items():
            print(f"  - {class_name}: {prob:.4f}")
            
    except Exception as e:
        print(f"Prediction failed: {e}")
        
    # Example 2: No Match Candidate
    mismatch_resume = (
        "Jane Smith\n"
        "Financial Clerk and Accountant with 4 years experience.\n"
        "Skills: Accounts Payable (AP), Accounts Receivable (AR), Microsoft Excel, bookkeeping."
    )
    
    print("\n--- Example Prediction 2: Complete Mismatch Candidate ---")
    print(f"Resume snippet: \"{mismatch_resume[:120]}...\"")
    print(f"JD snippet: \"{example_jd[:120]}...\"")
    
    try:
        result_mismatch = predict_fit(mismatch_resume, example_jd)
        print("\nPrediction Output:")
        print(f"Predicted Fit: {result_mismatch['predicted_label']}")
        print("Confidence Probabilities:")
        for class_name, prob in result_mismatch['class_probabilities'].items():
            print(f"  - {class_name}: {prob:.4f}")
            
    except Exception as e:
        print(f"Prediction failed: {e}")

if __name__ == "__main__":
    main()
