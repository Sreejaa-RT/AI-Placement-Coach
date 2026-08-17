import numpy as np

def calculate_ml_compatibility_score(probabilities):
    """
    Computes a continuous ML compatibility score between 0 and 100 based on class probabilities:
    ML_Compatibility = 100 * P(Good Fit) + 60 * P(Potential Fit) + 20 * P(No Fit)
    """
    # Alphabetical order: ['Good Fit', 'No Fit', 'Potential Fit']
    p_good = probabilities.get('Good Fit', 0.0)
    p_potential = probabilities.get('Potential Fit', 0.0)
    p_no = probabilities.get('No Fit', 0.0)
    
    ml_compatibility = (100 * p_good) + (60 * p_potential) + (20 * p_no)
    return float(ml_compatibility)

def calculate_skill_score(skill_match_ratio, jd_skills_count):
    """
    Computes a skill score out of 100.
    Returns None if no technical skills were recognized in the job description.
    """
    if jd_skills_count == 0:
        return None
    return float(skill_match_ratio * 100)

def calculate_keyword_score(keyword_overlap_ratio):
    """
    Computes keyword overlap score out of 100.
    """
    return float(keyword_overlap_ratio * 100)

def calculate_similarity_score(cosine_similarity):
    """
    Computes similarity score out of 100.
    """
    return float(cosine_similarity * 100)

def calculate_final_fit_score(ml_score, skill_score, keyword_score, similarity_score):
    """
    Calculates the final Resume Fit Score (0-100) using a weighted formula.
    Standard weights:
      - ML compatibility: 50%
      - Skill match: 30%
      - Keyword overlap: 15%
      - Cosine similarity: 5%
    If skill_score is None, its 30% weight is redistributed proportionally:
      - New weights: ML (50/70 = ~71.43%), Keyword (15/70 = ~21.43%), Similarity (5/70 = ~7.14%)
    """
    # Define standard weights
    weights = {
        'ml': 0.50,
        'skill': 0.30,
        'keyword': 0.15,
        'similarity': 0.05
    }
    
    # Check what scores are available
    active_scores = {
        'ml': ml_score,
        'keyword': keyword_score,
        'similarity': similarity_score
    }
    
    if skill_score is not None:
        active_scores['skill'] = skill_score
    
    # Calculate sum of weights for available components
    active_weights_sum = sum(weights[k] for k in active_scores.keys())
    
    # Compute weighted sum with normalized weights
    final_score = 0.0
    for k, score in active_scores.items():
        normalized_weight = weights[k] / active_weights_sum
        final_score += score * normalized_weight
        
    # Ensure range constraint [0, 100]
    return min(max(final_score, 0.0), 100.0)

def get_fit_category(score):
    """
    Deterministically maps a score to a project-defined fit category.
    """
    if score >= 90:
        return "Excellent Match"
    elif score >= 75:
        return "Strong Match"
    elif score >= 60:
        return "Moderate Match"
    elif score >= 40:
        return "Needs Improvement"
    else:
        return "Low Match"

def generate_strengths_and_suggestions(metrics):
    """
    Generates rule-based strengths and suggestions based strictly on computed metrics.
    """
    strengths = []
    suggestions = []
    
    skill_match_ratio = metrics.get('skill_match_ratio', 0.0)
    jd_skills_count = metrics.get('jd_skills_count', 0)
    keyword_overlap_ratio = metrics.get('keyword_overlap_ratio', 0.0)
    predicted_label = metrics.get('predicted_label', '')
    missing_skills = metrics.get('missing_skills', [])
    resume_word_count = metrics.get('resume_word_count', 0)
    
    # 1. Strengths
    if jd_skills_count > 0 and skill_match_ratio >= 0.75:
        strengths.append("Strong alignment with required technical skills.")
    if keyword_overlap_ratio >= 0.50:
        strengths.append("Good keyword alignment with the target job description.")
    if predicted_label == "Good Fit":
        strengths.append("Your resume shows strong overall compatibility with this role.")
        
    # 2. Suggestions (truthful improvement advices)
    if jd_skills_count > 0 and skill_match_ratio < 0.50:
        suggestions.append("Consider adding relevant skills from the job description that you genuinely possess.")
    if keyword_overlap_ratio < 0.30:
        suggestions.append("Consider aligning relevant terminology in your resume with the target job description.")
    if len(missing_skills) > 0:
        suggestions.append("Review the missing skills and highlight relevant experience on your resume if you possess it.")
    if resume_word_count < 300:
        suggestions.append("Consider adding relevant project or experience details to flesh out your resume.")
        
    return strengths, suggestions
