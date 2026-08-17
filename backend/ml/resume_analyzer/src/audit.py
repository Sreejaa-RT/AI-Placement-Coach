import os
import joblib
import pandas as pd
from scipy.sparse import hstack, csr_matrix

from .preprocess import clean_text
from .feature_engineering import extract_engineered_features
from .scoring import (
    calculate_ml_compatibility_score,
    calculate_skill_score,
    calculate_keyword_score,
    calculate_similarity_score,
    calculate_final_fit_score,
    get_fit_category,
    generate_strengths_and_suggestions
)

# Paths
MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models", "hybrid")

# Global variables for caching loaded models/vectorizers
_resume_vectorizer = None
_jd_vectorizer = None
_label_encoder = None
_scaler = None
_model = None

def load_audit_assets():
    """
    Loads and caches the Hybrid Stage 5 assets from models/hybrid/.
    """
    global _resume_vectorizer, _jd_vectorizer, _label_encoder, _scaler, _model
    
    if _model is None:
        try:
            _resume_vectorizer = joblib.load(os.path.join(MODELS_DIR, "resume_tfidf_vectorizer.pkl"))
            _jd_vectorizer = joblib.load(os.path.join(MODELS_DIR, "jd_tfidf_vectorizer.pkl"))
            _label_encoder = joblib.load(os.path.join(MODELS_DIR, "label_encoder.pkl"))
            _scaler = joblib.load(os.path.join(MODELS_DIR, "feature_scaler.pkl"))
            _model = joblib.load(os.path.join(MODELS_DIR, "hybrid_logistic_regression_model.pkl"))
        except Exception as e:
            raise IOError(f"Error loading Hybrid audit deliverables: {e}. Please run train_hybrid.py first.")

def run_resume_audit(resume_text, job_description):
    """
    Accepts raw resume text and job description, executes the ML model classification,
    runs the scoring logic, and compiles a comprehensive Resume Fit Audit.
    """
    # 1. Ensure assets are loaded
    load_audit_assets()
    
    # 2. Preprocess text
    cleaned_resume = clean_text(resume_text)
    cleaned_jd = clean_text(job_description)
    
    # 3. Create single row DataFrame for feature extraction
    row_df = pd.DataFrame({
        'cleaned_resume': [cleaned_resume],
        'cleaned_jd': [cleaned_jd],
        'resume_text': [resume_text],
        'job_description_text': [job_description]
    })
    
    # 4. Extract features
    _, eng_features = extract_engineered_features(row_df, _resume_vectorizer, _jd_vectorizer)
    
    # Fetch values from df
    cosine_similarity = float(row_df['resume_jd_cosine_similarity'].iloc[0])
    keyword_overlap_ratio = float(row_df['keyword_overlap_ratio'].iloc[0])
    skill_match_ratio = float(row_df['skill_match_ratio'].iloc[0])
    matched_skills = row_df['matched_skills'].iloc[0]
    missing_skills = row_df['missing_skills'].iloc[0]
    jd_skills_count = int(row_df['jd_skills_count'].iloc[0])
    resume_word_count = int(row_df['resume_word_count'].iloc[0])
    
    # 5. Transform raw texts into sparse TF-IDF vectors
    X_resume = _resume_vectorizer.transform([cleaned_resume])
    X_jd = _jd_vectorizer.transform([cleaned_jd])
    X_tfidf = hstack([X_resume, X_jd]).tocsr()
    
    # 6. Scale matching features
    X_eng_scaled = _scaler.transform(eng_features)
    
    # 7. Stack into hybrid vector
    X_hybrid = hstack([X_tfidf, csr_matrix(X_eng_scaled)]).tocsr()
    
    # 8. Classification prediction and probabilities
    pred_encoded = _model.predict(X_hybrid)[0]
    predicted_label = _label_encoder.inverse_transform([pred_encoded])[0]
    
    probabilities = _model.predict_proba(X_hybrid)[0]
    class_probs = {c: float(p) for c, p in zip(_label_encoder.classes_, probabilities)}
    
    # 9. Scoring Component Calculations
    ml_comp_score = calculate_ml_compatibility_score(class_probs)
    skill_score = calculate_skill_score(skill_match_ratio, jd_skills_count)
    keyword_score = calculate_keyword_score(keyword_overlap_ratio)
    similarity_score = calculate_similarity_score(cosine_similarity)
    
    # Calculate weighted fit score
    final_fit_score = calculate_final_fit_score(
        ml_comp_score, skill_score, keyword_score, similarity_score
    )
    fit_category = get_fit_category(final_fit_score)
    
    # 10. Strengths & Suggestions Generation
    metrics_for_rules = {
        'skill_match_ratio': skill_match_ratio,
        'jd_skills_count': jd_skills_count,
        'keyword_overlap_ratio': keyword_overlap_ratio,
        'predicted_label': predicted_label,
        'missing_skills': missing_skills,
        'resume_word_count': resume_word_count
    }
    strengths, suggestions = generate_strengths_and_suggestions(metrics_for_rules)
    
    # 11. Compile result dictionary
    return {
        "resume_fit_score": int(round(final_fit_score)),
        "fit_category": fit_category,
        "predicted_label": predicted_label,
        "ml_compatibility_score": round(ml_comp_score, 2),
        "skill_score": round(skill_score, 2) if skill_score is not None else None,
        "keyword_score": round(keyword_score, 2),
        "similarity_score": round(similarity_score, 2),
        "skill_match_ratio": round(skill_match_ratio, 4),
        "keyword_overlap_ratio": round(keyword_overlap_ratio, 4),
        "cosine_similarity": round(cosine_similarity, 4),
        "good_fit_probability": round(class_probs.get('Good Fit', 0.0), 4),
        "potential_fit_probability": round(class_probs.get('Potential Fit', 0.0), 4),
        "no_fit_probability": round(class_probs.get('No Fit', 0.0), 4),
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "strengths": strengths,
        "suggestions": suggestions
    }

def main():
    # Predefined JD asking for data science and programming skills
    target_jd = (
        "Job Opportunity: Data Scientist & Machine Learning Engineer\n"
        "We are looking for a Data Scientist to build predictive models and analyze large datasets.\n"
        "Requirements:\n"
        "- Strong experience programming in Python and query optimization in SQL.\n"
        "- Practical knowledge of Pandas, NumPy, Scikit-learn, and Git.\n"
        "- Experience in Machine Learning and Deep Learning with TensorFlow or PyTorch is highly desired."
    )
    
    # 1. Strong Match Resume (Has Python, SQL, Git, Pandas, NumPy, Scikit-learn, Machine Learning, Deep Learning)
    strong_resume = (
        "John Doe - Senior Data Scientist\n"
        "Professional Summary: Over 5 years of industry experience designing and deploying predictive models.\n"
        "Technical Skills:\n"
        "- Languages: Python, SQL, C++\n"
        "- Frameworks: Scikit-learn, Pandas, NumPy, TensorFlow, PyTorch\n"
        "- Tools: Git, Docker, AWS Cloud infrastructure\n"
        "Experience: Led development of neural network models using Deep Learning to automate product classifications."
    )
    
    # 2. Moderate Match Resume (Has Python, SQL, Git but missing framework/modeling skills)
    moderate_resume = (
        "Jane Smith - Software Developer\n"
        "Professional Summary: Software engineer with 3 years of experience writing web backends and scripts.\n"
        "Technical Skills:\n"
        "- Languages: Python, JavaScript, Java, SQL\n"
        "- Tools: Git, GitHub, MySQL\n"
        "Experience: Developed relational database query schedules and integrated API endpoints in Spring Boot."
    )
    
    # 3. Poor Match Resume (Completely unrelated non-technical profile)
    poor_resume = (
        "Robert Johnson - Accountant & Finance Officer\n"
        "Professional Summary: Focused Corporate Accountant with 4 years experience managing general ledgers.\n"
        "Skills: Bookkeeping, tax filing, Accounts Payable (AP), Accounts Receivable (AR), Microsoft Excel, spreadsheet validation."
    )
    
    test_cases = [
        ("TEST CASE 1: STRONG MATCH", strong_resume),
        ("TEST CASE 2: MODERATE MATCH", moderate_resume),
        ("TEST CASE 3: POOR MATCH", poor_resume)
    ]
    
    print("==================================================")
    print("STAGE 6: STANDALONE RESUME AUDIT VALIDATION RUN")
    print("==================================================")
    
    for title, resume in test_cases:
        print(f"\nRunning {title}...")
        try:
            audit_result = run_resume_audit(resume, target_jd)
            print("-" * 40)
            print(f"Resume Fit Score       : {audit_result['resume_fit_score']}/100")
            print(f"Fit Category           : {audit_result['fit_category']}")
            print(f"Predicted Label        : {audit_result['predicted_label']}")
            print(f"ML Compatibility Score : {audit_result['ml_compatibility_score']}")
            print(f"Skill Score            : {audit_result['skill_score']}")
            print(f"Keyword Score          : {audit_result['keyword_score']}")
            print(f"Similarity Score       : {audit_result['similarity_score']}")
            print(f"Cosine Similarity      : {audit_result['cosine_similarity']:.4f}")
            print(f"Skill Match Ratio      : {audit_result['skill_match_ratio']:.4f}")
            print(f"Good Fit Prob          : {audit_result['good_fit_probability']:.4f}")
            print(f"Potential Fit Prob     : {audit_result['potential_fit_probability']:.4f}")
            print(f"No Fit Prob            : {audit_result['no_fit_probability']:.4f}")
            print(f"Matched Skills         : {audit_result['matched_skills']}")
            print(f"Missing Skills         : {audit_result['missing_skills']}")
            print(f"Strengths              : {audit_result['strengths']}")
            print(f"Suggestions            : {audit_result['suggestions']}")
            print("-" * 40)
        except Exception as e:
            print(f"Test case failed: {e}")

if __name__ == "__main__":
    main()
