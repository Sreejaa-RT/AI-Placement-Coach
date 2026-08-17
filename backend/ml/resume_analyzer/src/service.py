import os
from .audit import load_audit_assets, run_resume_audit

# Expected artifacts in models/hybrid/
MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models", "hybrid")
REQUIRED_ARTIFACTS = [
    "hybrid_logistic_regression_model.pkl",
    "resume_tfidf_vectorizer.pkl",
    "jd_tfidf_vectorizer.pkl",
    "feature_scaler.pkl",
    "label_encoder.pkl",
    "skill_vocabulary.json"
]

def initialize_ml_service():
    """
    Verifies that all Stage 5 hybrid model assets exist, and pre-loads them into memory.
    Raises FileNotFoundError if any required pkl or json asset is missing.
    """
    missing = []
    for artifact in REQUIRED_ARTIFACTS:
        path = os.path.join(MODELS_DIR, artifact)
        if not os.path.exists(path):
            missing.append(artifact)
            
    if missing:
        raise FileNotFoundError(
            f"Required ML artifacts are missing from {MODELS_DIR}: {', '.join(missing)}. "
            "Please run train_hybrid.py to generate them before starting the API."
        )
        
    print("[ML Service] Loading model and vectorizer assets into memory...")
    load_audit_assets()
    print("[ML Service] Stage 5/6 ML Pipeline assets loaded successfully!")

def execute_resume_audit(resume_text: str, job_description: str) -> dict:
    """
    Executes the Resume Audit scoring pipeline.
    """
    return run_resume_audit(resume_text, job_description)
