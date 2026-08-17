import re

def clean_text(text):
    """
    Cleans raw resume or job description text.
    Preserves critical technical terms by mapping them to safe alphabetic representations,
    removes URLs, emails, HTML markup, and irrelevant special characters, and normalizes whitespace.
    """
    if not isinstance(text, str):
        return ""
    
    # 1. Convert to lowercase for uniform matching
    text = text.lower()
    
    # 2. Remove HTML tags
    text = re.sub(r'<[^>]*>', ' ', text)
    
    # 3. Remove URLs/Websites
    text = re.sub(r'https?://\S+|www\.\S+', ' ', text)
    
    # 4. Remove Email Addresses
    text = re.sub(r'\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b', ' ', text)
    
    # 5. Protect and map specific technical terms containing punctuation
    # This prevents special character cleaning from turning C++ -> C, C# -> C, or .NET -> NET.
    # Note: These are converted to clean, distinct alphabetic words (e.g., 'cplusplus'),
    # which TF-IDF will capture as single, unique, and meaningful tokens.
    tech_mappings = {
        r'\bc\+\+': 'cplusplus',
        r'\bc#': 'csharp',
        r'\.net\b': 'dotnet',
        r'\bnode\.js\b': 'nodejs',
        r'\breact\.js\b': 'reactjs',
        r'\bvue\.js\b': 'vuejs',
        r'\bnext\.js\b': 'nextjs',
        r'\bnuxt\.js\b': 'nuxtjs',
        r'\bexpress\.js\b': 'expressjs',
        r'\bthree\.js\b': 'threejs',
        r'\bangular\.js\b': 'angularjs',
        r'\bchart\.js\b': 'chartjs',
        r'\bd3\.js\b': 'd3js',
    }
    
    for pattern, replacement in tech_mappings.items():
        text = re.sub(pattern, replacement, text)
        
    # 6. Remove remaining special characters and punctuation
    # We keep only alphanumeric characters and spaces.
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    
    # 7. Normalize whitespaces (replace multiple spaces, newlines, or tabs with a single space)
    text = re.sub(r'\s+', ' ', text)
    
    # 8. Strip leading/trailing spaces
    return text.strip()
