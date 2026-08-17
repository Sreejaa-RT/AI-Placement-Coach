import os
import re
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS
from .preprocess import clean_text

# Technical skills vocabulary
SKILLS_VOCAB = [
    'python', 'java', 'c', 'c++', 'c#', 'javascript', 'typescript', 'sql', 'html', 'css', 
    'react', 'angular', 'node.js', 'django', 'flask', 'fastapi', 'spring', '.net', 'aws', 
    'azure', 'docker', 'kubernetes', 'git', 'github', 'machine learning', 'deep learning', 
    'nlp', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn', 'mongodb', 'mysql', 
    'postgresql', 'power bi', 'tableau'
]

# Get preprocessed representations of these skills to match our cleaned text representation
# e.g., 'c++' -> 'cplusplus', 'scikit-learn' -> 'scikit learn'
CLEANED_SKILLS_VOCAB = [clean_text(skill) for skill in SKILLS_VOCAB]

def get_skill_counts_and_matches(resume_cleaned, jd_cleaned):
    """
    Computes skill counts, matched skills, missing skills, and ratios
    using word-boundary regex matching against the technical skills vocabulary.
    """
    resume_skills = set()
    jd_skills = set()
    
    for original_skill, cleaned_skill in zip(SKILLS_VOCAB, CLEANED_SKILLS_VOCAB):
        # Create a regex with word boundaries to ensure we don't do partial matches
        pattern = r'\b' + re.escape(cleaned_skill) + r'\b'
        
        if re.search(pattern, resume_cleaned):
            resume_skills.add(original_skill)
        if re.search(pattern, jd_cleaned):
            jd_skills.add(original_skill)
            
    matched_skills = resume_skills.intersection(jd_skills)
    missing_skills = jd_skills - resume_skills
    
    resume_skills_count = len(resume_skills)
    jd_skills_count = len(jd_skills)
    matched_skills_count = len(matched_skills)
    missing_skills_count = len(missing_skills)
    
    skill_match_ratio = (matched_skills_count / jd_skills_count) if jd_skills_count > 0 else 0.0
    
    return (
        resume_skills_count,
        jd_skills_count,
        matched_skills_count,
        missing_skills_count,
        skill_match_ratio,
        list(matched_skills),
        list(missing_skills)
    )

def extract_engineered_features(df, resume_vectorizer, jd_vectorizer):
    """
    Extracts all 10 engineered matching features for a dataframe.
    Requires already-fitted TF-IDF vectorizers to compute cosine similarities and keyword overlaps.
    """
    # 1. Word counts and ratios
    print("Calculating document lengths and ratios...")
    df['resume_word_count'] = df['cleaned_resume'].fillna('').apply(lambda x: len(x.split()))
    df['job_description_word_count'] = df['cleaned_jd'].fillna('').apply(lambda x: len(x.split()))
    df['resume_to_jd_length_ratio'] = df.apply(
        lambda row: row['resume_word_count'] / row['job_description_word_count'] if row['job_description_word_count'] > 0 else 0.0,
        axis=1
    )
    
    # 2. Skill matching metrics
    print("Calculating skill matching counts, lists, and ratios...")
    skills_results = df.apply(
        lambda row: get_skill_counts_and_matches(row['cleaned_resume'], row['cleaned_jd']),
        axis=1
    )
    
    df['resume_skills_count'] = [r[0] for r in skills_results]
    df['jd_skills_count'] = [r[1] for r in skills_results]
    df['matched_skills_count'] = [r[2] for r in skills_results]
    df['missing_skills_count'] = [r[3] for r in skills_results]
    df['skill_match_ratio'] = [r[4] for r in skills_results]
    df['matched_skills'] = [r[5] for r in skills_results]
    df['missing_skills'] = [r[6] for r in skills_results]
    
    # 3. TF-IDF vector transformations (NO FITTING here to avoid data leakage!)
    print("Running TF-IDF transformations for similarity and overlap computation...")
    X_resume = resume_vectorizer.transform(df['cleaned_resume'].fillna(''))
    X_jd = jd_vectorizer.transform(df['cleaned_jd'].fillna(''))
    
    # 4. Cosine similarity
    print("Computing row-wise cosine similarities...")
    # Map both text columns to the same TF-IDF space (resume_vectorizer) to ensure alignment
    X_resume_same = resume_vectorizer.transform(df['cleaned_resume'].fillna(''))
    X_jd_same = resume_vectorizer.transform(df['cleaned_jd'].fillna(''))
    
    dots = np.asarray(X_resume_same.multiply(X_jd_same).sum(axis=1)).flatten()
    norms1 = np.sqrt(np.asarray(X_resume_same.multiply(X_resume_same).sum(axis=1)).flatten())
    norms2 = np.sqrt(np.asarray(X_jd_same.multiply(X_jd_same).sum(axis=1)).flatten())
    norms = norms1 * norms2
    norms[norms == 0] = 1.0 # Protect division by zero
    df['resume_jd_cosine_similarity'] = dots / norms
    
    # 5. Keyword Overlap Ratio
    print("Computing TF-IDF keyword overlap ratios...")
    resume_vocab_dict = resume_vectorizer.vocabulary_
    jd_vocab_list = jd_vectorizer.get_feature_names_out()
    
    keyword_overlaps = []
    for i in range(len(df)):
        active_resume_indices = set(X_resume[i].indices)
        overlap_count = 0
        meaningful_jd_count = 0
        for idx in X_jd[i].indices:
            term = jd_vocab_list[idx]
            if term in ENGLISH_STOP_WORDS:
                continue
            meaningful_jd_count += 1
            res_idx = resume_vocab_dict.get(term)
            if res_idx is not None and res_idx in active_resume_indices:
                overlap_count += 1
        ratio = (overlap_count / meaningful_jd_count) if meaningful_jd_count > 0 else 0.0
        keyword_overlaps.append(ratio)
        
    df['keyword_overlap_ratio'] = keyword_overlaps
    
    # Return the dataframe with engineered columns and the features matrix
    feature_cols = [
        'resume_jd_cosine_similarity',
        'keyword_overlap_ratio',
        'resume_word_count',
        'job_description_word_count',
        'resume_to_jd_length_ratio',
        'resume_skills_count',
        'jd_skills_count',
        'matched_skills_count',
        'missing_skills_count',
        'skill_match_ratio'
    ]
    
    return df, df[feature_cols]
