import os
import sys
import traceback
from typing import List, Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Dynamic path resolution to import from assessment sibling directory
current_dir = os.path.dirname(os.path.abspath(__file__))
ml_dir = os.path.abspath(os.path.join(current_dir, "..", ".."))
if ml_dir not in sys.path:
    sys.path.insert(0, ml_dir)

from .service import initialize_ml_service, execute_resume_audit
from .resume_parser import validate_file_metadata, extract_text_from_stream
from .job_descriptions import get_job_description

from assessment.src.service import (
    initialize_assessment_service,
    get_questions,
    check_answer,
    calculate_performance
)

app = FastAPI(
    title="AI Placement Coach - ML Resume Audit & Assessment API",
    description="Supervised ML API for resume analysis and Assessment Center evaluation",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Response Model
class ResumeAuditResponse(BaseModel):
    resume_fit_score: int = Field(..., description="Final score 0-100")
    fit_category: str = Field(..., description="Deterministically mapped category")
    predicted_label: str = Field(..., description="Trained Logistic Regression output label")
    ml_compatibility_score: float = Field(..., description="Probabilistic compatibility index")
    skill_score: Optional[float] = Field(None, description="Skill score or None if no skills in JD")
    keyword_score: float = Field(..., description="Keyword overlap score out of 100")
    similarity_score: float = Field(..., description="Cosine similarity score out of 100")
    skill_match_ratio: float = Field(..., description="Ratio of matched skills to total JD skills")
    keyword_overlap_ratio: float = Field(..., description="Ratio of matched keywords to total JD keywords")
    cosine_similarity: float = Field(..., description="Raw cosine similarity between resume and JD")
    good_fit_probability: float = Field(..., description="Probability of Good Fit class")
    potential_fit_probability: float = Field(..., description="Probability of Potential Fit class")
    no_fit_probability: float = Field(..., description="Probability of No Fit class")
    matched_skills: List[str] = Field(..., description="Detected skills present in both document fields")
    missing_skills: List[str] = Field(..., description="Requested skills present in JD but not resume")
    strengths: List[str] = Field(..., description="Computed strengths based on criteria checks")
    suggestions: List[str] = Field(..., description="Constructive improvement directives")

@app.on_event("startup")
def startup_event():
    """
    Load ML model and Assessment questions artifacts once at application start-up.
    """
    try:
        initialize_ml_service()
        initialize_assessment_service()
    except Exception as e:
        print("[CRITICAL] Failed to initialize ML and Assessment Service assets.")
        traceback.print_exc()
        # Fail loud so the server doesn't run in a broken state
        os._exit(1)

@app.get("/api/v1/resume/health")
def health_check():
    """
    Endpoint for verifying health status and availability.
    """
    return {
        "status": "healthy",
        "service": "AI Placement Coach ML Audit Engine",
        "timestamp": os.getenv("PORT", "8000")
    }

@app.post("/api/v1/resume/audit", response_model=ResumeAuditResponse)
async def audit_resume(
    resume: UploadFile = File(...),
    job_role_id: int = Form(...),
    custom_job_description: Optional[str] = Form(None)
):
    """
    Audits an uploaded PDF/DOCX resume file against a specified job role's description.
    """
    # 1. Read file and inspect size
    try:
        content = await resume.read()
        file_size = len(content)
        # Reset file pointer for parsing
        await resume.seek(0)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not read uploaded file: {str(e)}"
        )

    # 2. Validate metadata (extension and size limits)
    try:
        validate_file_metadata(resume.filename, file_size)
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )

    # 3. Retrieve Job Description
    job_description = None
    if job_role_id == 13:  # Custom Role
        if not custom_job_description or not custom_job_description.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Custom roles require a job description."
            )
        job_description = custom_job_description.strip()
    else:
        job_description = get_job_description(job_role_id)
        if not job_description:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid job role selected."
            )

    # 4. Extract Text
    try:
        # Pass the bytes file object wrapped in a stream-like wrapper if needed
        # Since PdfReader and Document can take bytes directly or stream, let's wrap it in BytesIO
        import io
        file_stream = io.BytesIO(content)
        resume_text = extract_text_from_stream(file_stream, resume.filename)
    except ValueError as parser_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(parser_err)
        )
    except Exception as e:
        print(f"[ERROR] Resume parsing failed unexpectedly: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Text extraction failed: {str(e)}"
        )

    # 5. Run Inference and scoring
    try:
        audit_result = execute_resume_audit(resume_text, job_description)
        
        # Verify that probabilities sum to ~1.0
        prob_sum = (
            audit_result['good_fit_probability'] +
            audit_result['potential_fit_probability'] +
            audit_result['no_fit_probability']
        )
        if not (0.99 <= prob_sum <= 1.01):
            print(f"[WARNING] Probabilities sum to {prob_sum:.4f}, expected ~1.0")

        return audit_result
        
    except Exception as ml_err:
        print(f"[CRITICAL] ML inference pipeline failed: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Resume Audit failed: An internal error occurred while processing the ML compatibility scores."
        )

# ----------------------------------------------------
# Assessment Center Endpoints (Stage 8)
# ----------------------------------------------------

class AttemptRequest(BaseModel):
    question_id: str = Field(..., description="Unique question identifier")
    selected_option: int = Field(..., description="Selected option index (0 to 3)")
    time_taken_seconds: float = Field(..., description="Time spent in seconds")
    attempt_number: int = Field(..., description="Attempt count for this question")

@app.get("/api/v1/assessment/questions")
def fetch_questions(
    category: Optional[str] = None,
    topic: Optional[str] = None,
    difficulty: Optional[str] = None,
    limit: int = 10,
    user_id: Optional[str] = None,
    attempts_json: Optional[str] = None
):
    """
    Returns filtered, adaptive questions without answer keys or explanations.
    """
    try:
        questions = get_questions(
            category=category,
            topic=topic,
            difficulty=difficulty,
            limit=limit,
            user_id=user_id,
            attempts_json=attempts_json
        )
        return questions
    except Exception as e:
        print(f"[ERROR] Fetching questions failed: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch questions: {str(e)}"
        )

@app.post("/api/v1/assessment/attempt")
def submit_attempt(request: AttemptRequest):
    """
    Validates selected answer option and returns correctness assessment details.
    """
    try:
        result = check_answer(request.question_id, request.selected_option)
        return result
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as e:
        print(f"[ERROR] Submitting attempt failed: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process attempt: {str(e)}"
        )

@app.get("/api/v1/assessment/performance")
def fetch_performance(
    user_id: Optional[str] = None,
    attempts_json: Optional[str] = None
):
    """
    Computes overall accuracy, sub-accuracies, strengths, weaknesses, and next-topic recommendations.
    """
    try:
        perf = calculate_performance(user_id=user_id, attempts_json=attempts_json)
        return perf
    except Exception as e:
        print(f"[ERROR] Calculating performance failed: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate performance: {str(e)}"
        )
