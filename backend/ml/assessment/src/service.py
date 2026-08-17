import os
import json
import random
import requests
from typing import List, Dict, Any, Optional

# Path to the processed questions database
QUESTIONS_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "processed", "questions.json")

# Global variables for caching loaded questions
_questions: List[Dict[str, Any]] = []
_questions_by_id: Dict[str, Dict[str, Any]] = {}

# Topic structure for fallback or default recommendation resolution
TOPICS_FALLBACK = {
    "Data Structures": "Arrays",
    "Algorithms": "Sorting",
    "DBMS / SQL": "SQL",
    "Operating Systems": "Processes",
    "Computer Networks": "OSI/TCP-IP",
    "Object-Oriented Programming": "Classes/Objects",
    "Programming Fundamentals": "Variables",
    "Quantitative Aptitude": "Percentages",
    "Logical Reasoning": "Number Series",
    "Verbal Ability": "Grammar"
}

def initialize_assessment_service():
    """
    Loads and caches the standardized MMLU/CS-Bench questions database.
    """
    global _questions, _questions_by_id
    if not _questions:
        if os.path.exists(QUESTIONS_FILE):
            try:
                with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
                    _questions = json.load(f)
                _questions_by_id = {q["question_id"]: q for q in _questions}
                print(f"[Assessment Service] Loaded {len(_questions)} questions successfully.")
            except Exception as e:
                print(f"[Assessment Service] Error reading questions file: {e}")
        else:
            print(f"[Assessment Service] Warning: questions.json not found at {QUESTIONS_FILE}!")

def fetch_user_attempts_from_firestore(user_id: str) -> List[Dict[str, Any]]:
    """
    Queries the user's attempt history directly from the Firestore REST API.
    Handles network/permission blocks gracefully by returning an empty list.
    """
    if not user_id:
        return []
        
    url = f"https://firestore.googleapis.com/v1/projects/ai-placement-coach-30fd7/databases/(default)/documents/users/{user_id}/assessmentAttempts?pageSize=1000"
    try:
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            data = res.json()
            documents = data.get("documents", [])
            attempts = []
            for doc_node in documents:
                fields = doc_node.get("fields", {})
                
                # Parsing helper to extract different Firestore values
                def get_val(f_name: str):
                    f_val = fields.get(f_name, {})
                    if "stringValue" in f_val:
                        return f_val["stringValue"]
                    elif "booleanValue" in f_val:
                        return f_val["booleanValue"]
                    elif "integerValue" in f_val:
                        return int(f_val["integerValue"])
                    elif "doubleValue" in f_val:
                        return float(f_val["doubleValue"])
                    return None
                
                attempts.append({
                    "question_id": get_val("questionId") or get_val("question_id"),
                    "category": get_val("category"),
                    "topic": get_val("topic"),
                    "difficulty": get_val("difficulty"),
                    "selected_option": get_val("selectedOption") or get_val("selected_option"),
                    "correct_option": get_val("correctOption") or get_val("correct_option"),
                    "is_correct": get_val("isCorrect") or get_val("is_correct"),
                    "time_taken_seconds": get_val("timeTakenSeconds") or get_val("time_taken_seconds"),
                    "attempt_number": get_val("attemptNumber") or get_val("attempt_number"),
                    "timestamp": get_val("timestamp")
                })
            return attempts
        else:
            print(f"[Assessment Service] Firestore REST API status: {res.status_code}")
    except Exception as e:
        print(f"[Assessment Service] Firestore fetch error: {e}")
    return []

def get_questions(
    category: Optional[str] = None,
    topic: Optional[str] = None,
    difficulty: Optional[str] = None,
    limit: int = 10,
    user_id: Optional[str] = None,
    attempts_json: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Returns filtered, randomized questions without answer keys.
    Integrates an adaptive recommendation logic:
      - Excludes already correctly answered questions.
      - Automatically scales difficulty based on recent performance history.
    """
    initialize_assessment_service()
    
    # 1. Apply basic query filters
    candidates = _questions
    if category:
        candidates = [q for q in candidates if q["category"].lower() == category.lower()]
    if topic:
        candidates = [q for q in candidates if q["topic"].lower() == topic.lower()]
    if difficulty:
        candidates = [q for q in candidates if q["difficulty"].lower() == difficulty.lower()]
        
    if not candidates:
        return []
        
    # 2. Parse attempt history
    attempts = []
    if attempts_json:
        try:
            attempts = json.loads(attempts_json)
        except Exception:
            pass
    elif user_id:
        attempts = fetch_user_attempts_from_firestore(user_id)
        
    # 3. Deduplicate based on previous correct answers
    answered_correctly = set()
    for att in attempts:
        is_cor = att.get("is_correct") or att.get("isCorrect")
        q_id = att.get("question_id") or att.get("questionId")
        if is_cor and q_id:
            answered_correctly.add(q_id)
            
    fresh_candidates = [q for q in candidates if q["question_id"] not in answered_correctly]
    if not fresh_candidates:
        fresh_candidates = candidates  # Recycle if all answered
        
    # 4. Adaptive difficulty scaling
    recent_attempts = attempts[-3:] if attempts else []
    if len(recent_attempts) >= 2:
        correct_count = sum(1 for att in recent_attempts if att.get("is_correct") or att.get("isCorrect"))
        accuracy = correct_count / len(recent_attempts)
        
        if accuracy >= 0.8:
            # Shift difficulty up
            harder = [q for q in fresh_candidates if q["difficulty"] in ["Hard", "Medium"]]
            if harder:
                fresh_candidates = harder
        elif accuracy < 0.5:
            # Shift difficulty down
            easier = [q for q in fresh_candidates if q["difficulty"] in ["Easy", "Medium"]]
            if easier:
                fresh_candidates = easier
                
    # 5. Extract sample and format response (strip correct keys/explanations)
    selected = random.sample(fresh_candidates, min(limit, len(fresh_candidates)))
    
    result = []
    for q in selected:
        result.append({
            "question_id": q["question_id"],
            "source_dataset": q["source_dataset"],
            "category": q["category"],
            "topic": q["topic"],
            "question_text": q["question_text"],
            "option_a": q["option_a"],
            "option_b": q["option_b"],
            "option_c": q["option_c"],
            "option_d": q["option_d"],
            "difficulty": q["difficulty"]
        })
    return result

def check_answer(question_id: str, selected_option: int) -> Dict[str, Any]:
    """
    Stateless answer validation. Compares choice index to correct letter.
    """
    initialize_assessment_service()
    q = _questions_by_id.get(question_id)
    if not q:
        raise ValueError("Invalid question ID.")
        
    # Convert index 0-3 to options letter
    if selected_option < 0 or selected_option > 3:
        raise ValueError("Invalid selected_option index. Must be between 0 and 3.")
        
    user_letter = ["A", "B", "C", "D"][selected_option]
    is_correct = (user_letter == q["correct_answer"])
    
    return {
        "is_correct": is_correct,
        "correct_answer": q["correct_answer"],
        "explanation": q["explanation"],
        "category": q["category"],
        "topic": q["topic"],
        "difficulty": q["difficulty"]
    }

def calculate_performance(user_id: Optional[str] = None, attempts_json: Optional[str] = None) -> Dict[str, Any]:
    """
    Calculates detailed metrics and generates practice recommendations for a user.
    """
    attempts = []
    if attempts_json:
        try:
            attempts = json.loads(attempts_json)
        except Exception:
            pass
    elif user_id:
        attempts = fetch_user_attempts_from_firestore(user_id)
        
    # Default return structure if no attempt history is present
    default_performance = {
        "overall_accuracy": 0.0,
        "category_accuracy": {},
        "topic_accuracy": {},
        "difficulty_accuracy": {},
        "category_attempts": {},
        "difficulty_attempts": {},
        "total_attempted": 0,
        "correct": 0,
        "incorrect": 0,
        "average_response_time": 0.0,
        "strongest_topics": [],
        "weakest_topics": [],
        "recommendation": {
            "recommended_category": "Data Structures",
            "recommended_topic": "Arrays",
            "recommended_difficulty": "Easy",
            "reason": "Start with a category to build your placement assessment profile."
        }
    }
    
    if not attempts:
        return default_performance
        
    total_attempts = len(attempts)
    correct_attempts = sum(1 for att in attempts if att.get("is_correct") or att.get("isCorrect"))
    incorrect_attempts = total_attempts - correct_attempts
    overall_accuracy = (correct_attempts / total_attempts) * 100
    
    total_time = sum(float(att.get("time_taken_seconds") or att.get("time_taken_seconds") or 0.0) for att in attempts)
    avg_response_time = total_time / total_attempts if total_attempts > 0 else 0.0
    
    # Track grouping attempts/successes
    cat_attempts: Dict[str, int] = {}
    cat_correct: Dict[str, int] = {}
    topic_attempts: Dict[str, int] = {}
    topic_correct: Dict[str, int] = {}
    diff_attempts: Dict[str, int] = {}
    diff_correct: Dict[str, int] = {}
    
    for att in attempts:
        cat = att.get("category")
        topic = att.get("topic")
        diff = att.get("difficulty")
        is_cor = att.get("is_correct") or att.get("isCorrect")
        
        if cat:
            cat_attempts[cat] = cat_attempts.get(cat, 0) + 1
            if is_cor:
                cat_correct[cat] = cat_correct.get(cat, 0) + 1
        if topic:
            topic_attempts[topic] = topic_attempts.get(topic, 0) + 1
            if is_cor:
                topic_correct[topic] = topic_correct.get(topic, 0) + 1
        if diff:
            diff_attempts[diff] = diff_attempts.get(diff, 0) + 1
            if is_cor:
                diff_correct[diff] = diff_correct.get(diff, 0) + 1
                
    # Calculate accuracy percentages
    cat_accuracy = {cat: (cat_correct.get(cat, 0) / cat_attempts[cat]) * 100 for cat in cat_attempts}
    topic_accuracy = {topic: (topic_correct.get(topic, 0) / topic_attempts[topic]) * 100 for topic in topic_attempts}
    diff_accuracy = {diff: (diff_correct.get(diff, 0) / diff_attempts[diff]) * 100 for diff in diff_attempts}
    
    # Sort topics by performance
    sorted_topics = sorted(topic_accuracy.items(), key=lambda x: x[1])
    
    strongest_topics = [t[0] for t in sorted_topics if t[1] >= 70.0][::-1]
    weakest_topics = [t[0] for t in sorted_topics if t[1] < 50.0]
    
    # Baseline recommendation logic
    rec_cat = "Data Structures"
    rec_topic = "Arrays"
    rec_diff = "Easy"
    rec_reason = "Start with a category to build your placement assessment profile."
    
    if weakest_topics:
        rec_topic = weakest_topics[0]
        # Resolve category and difficulty from attempts
        for att in attempts:
            if att.get("topic") == rec_topic:
                rec_cat = att.get("category")
                rec_diff = att.get("difficulty") or "Medium"
                break
        topic_acc = topic_accuracy[rec_topic]
        rec_reason = f"Your current accuracy in {rec_topic} is {topic_acc:.1f}%, which is below your overall assessment accuracy of {overall_accuracy:.1f}%."
    else:
        # If no weak topics exist, recommend the category with the lowest overall accuracy
        if cat_accuracy:
            lowest_cat = min(cat_accuracy.items(), key=lambda x: x[1])
            rec_cat = lowest_cat[0]
            rec_topic = TOPICS_FALLBACK.get(rec_cat, "General")
            cat_acc = lowest_cat[1]
            rec_reason = f"Your overall accuracy in {rec_cat} is {cat_acc:.1f}%. Strengthen this category to increase your readiness score."
            rec_diff = "Medium"
            
    return {
        "overall_accuracy": round(overall_accuracy, 2),
        "category_accuracy": {k: round(v, 2) for k, v in cat_accuracy.items()},
        "topic_accuracy": {k: round(v, 2) for k, v in topic_accuracy.items()},
        "difficulty_accuracy": {k: round(v, 2) for k, v in diff_accuracy.items()},
        "category_attempts": cat_attempts,
        "difficulty_attempts": diff_attempts,
        "total_attempted": total_attempts,
        "correct": correct_attempts,
        "incorrect": incorrect_attempts,
        "average_response_time": round(avg_response_time, 2),
        "strongest_topics": strongest_topics,
        "weakest_topics": weakest_topics,
        "recommendation": {
            "recommended_category": rec_cat,
            "recommended_topic": rec_topic,
            "recommended_difficulty": rec_diff,
            "reason": rec_reason
        }
    }
