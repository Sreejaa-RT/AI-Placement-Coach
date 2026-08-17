# Predefined Job Descriptions mapped to UI Target Roles
# These are application inputs and were NOT used to retrain the ML model.

JOB_DESCRIPTIONS = {
    0: (
        "Job Description: Software Engineer\n"
        "We are seeking a versatile Software Engineer to design, develop, and maintain software applications.\n"
        "Requirements:\n"
        "- Strong programming skills in Python, Java, or C++.\n"
        "- Solid understanding of algorithms, data structures, and software architecture.\n"
        "- Experience with Git version control, Docker containers, and SQL databases.\n"
        "- Familiarity with SDLC, software testing, and CI/CD pipelines."
    ),
    1: (
        "Job Description: Frontend Developer\n"
        "We are looking for a Frontend Developer to build clean, responsive, and interactive user interfaces.\n"
        "Requirements:\n"
        "- High proficiency in HTML, CSS, JavaScript, and TypeScript.\n"
        "- Solid hands-on experience with modern frontend frameworks, particularly React or Angular.\n"
        "- Knowledge of responsive web design, cross-browser compatibility, and state management.\n"
        "- Familiarity with developer tools, Git, and packaging/building web applications."
    ),
    2: (
        "Job Description: Backend Developer\n"
        "We are seeking a Backend Developer to design, build, and optimize backend services and API layers.\n"
        "Requirements:\n"
        "- Strong backend programming experience in Node.js, Python (using Django, Flask, or FastAPI), or Java (Spring Boot).\n"
        "- Designing and optimizing database structures with SQL databases.\n"
        "- Experience building RESTful APIs, securing endpoints, and managing microservices.\n"
        "- Hands-on knowledge of Docker containers and Git workflows."
    ),
    3: (
        "Job Description: Full Stack Developer\n"
        "We are looking for a Full Stack Developer comfortable working across both client and server codebases.\n"
        "Requirements:\n"
        "- Proficiency in frontend technologies: HTML, CSS, JavaScript, and React.\n"
        "- Strong backend development skills with Node.js, Express, and SQL databases.\n"
        "- Experience managing the full deployment lifecycle using Git, Docker, and cloud hosting.\n"
        "- Building secure RESTful APIs and responsive web interfaces."
    ),
    4: (
        "Job Description: Data Analyst\n"
        "We are seeking a Data Analyst to translate raw numbers into actionable business insights.\n"
        "Requirements:\n"
        "- Expert level knowledge of SQL querying, database extraction, and spreadsheet manipulation in Excel.\n"
        "- Experience building dashboards and data visualizations using Tableau or similar tools.\n"
        "- Basic scripting in Python (using Pandas and NumPy libraries) for data cleaning and manipulation.\n"
        "- Strong statistical analysis, reporting, and communication skills."
    ),
    5: (
        "Job Description: Data Scientist\n"
        "We are looking for a Data Scientist to build predictive ML models and perform statistical data modeling.\n"
        "Requirements:\n"
        "- Strong programming skills in Python and database query optimization in SQL.\n"
        "- Deep experience in data modeling and statistics using Pandas, NumPy, and Scikit-learn.\n"
        "- Practical knowledge of building neural networks and deep learning models with TensorFlow or PyTorch.\n"
        "- Version control experience with Git."
    ),
    6: (
        "Job Description: Machine Learning Engineer\n"
        "We are seeking a Machine Learning Engineer to design, deploy, and scale machine learning systems in production.\n"
        "Requirements:\n"
        "- Expertise in Python programming, Git, and containerization via Docker.\n"
        "- Building, training, and deploying Machine Learning and Deep Learning models using TensorFlow or PyTorch.\n"
        "- Experience processing large-scale data utilizing Spark or Hadoop architectures.\n"
        "- Deploying models as microservices in production systems."
    ),
    7: (
        "Job Description: Java Developer\n"
        "We are seeking a Java Developer to build high-performance enterprise applications.\n"
        "Requirements:\n"
        "- Strong expertise in core Java and building microservices with the Spring / Spring Boot framework.\n"
        "- Experience designing database schemas and optimizing database performance in SQL.\n"
        "- Version control using Git and container deployment with Docker.\n"
        "- Understanding of enterprise security, concurrency, and multithreading concepts."
    ),
    8: (
        "Job Description: Python Developer\n"
        "We are looking for a Python Developer to build web services, scrapers, and automation scripts.\n"
        "Requirements:\n"
        "- Strong expertise in Python programming and backend frameworks (Django, Flask, or FastAPI).\n"
        "- Experience querying and optimizing relational databases using SQL.\n"
        "- Version control using Git and deployment using Docker.\n"
        "- Writing clean, modular, and well-tested code."
    ),
    9: (
        "Job Description: Mobile App Developer\n"
        "We are looking for a Mobile App Developer to build native or cross-platform applications.\n"
        "Requirements:\n"
        "- Experience developing mobile apps in JavaScript (React Native), Java (Android), or Swift (iOS).\n"
        "- Integrating apps with backend systems using RESTful APIs.\n"
        "- Familiarity with mobile build processes, app store guidelines, and version control using Git.\n"
        "- Designing responsive, touch-friendly user interfaces."
    ),
    10: (
        "Job Description: DevOps Engineer\n"
        "We are seeking a DevOps Engineer to automate deployment pipelines and manage server systems.\n"
        "Requirements:\n"
        "- Proficient with Linux administration, shell scripting, and Git version control.\n"
        "- Building CI/CD pipelines using Jenkins or similar platforms.\n"
        "- Designing infrastructure using container platforms (Docker, Kubernetes) and cloud services (AWS/Azure/GCP).\n"
        "- Infrastructure as Code and system health monitoring."
    ),
    11: (
        "Job Description: Cloud Engineer\n"
        "We are looking for a Cloud Engineer to design, build, and support secure cloud infrastructure.\n"
        "Requirements:\n"
        "- Hands-on development experience with public cloud platforms, primarily AWS, Azure, or GCP.\n"
        "- Proficiency in container architectures (Docker, Kubernetes) and script development (Python, Bash).\n"
        "- Understanding of cloud networking, security groups, database hosting, and Git workflows.\n"
        "- Monitoring cloud resource usage and optimizing hosting costs."
    ),
    12: (
        "Job Description: Cybersecurity Analyst\n"
        "We are seeking a Cybersecurity Analyst to monitor systems, investigate threats, and secure infrastructure.\n"
        "Requirements:\n"
        "- Deep understanding of network protocols, threat analysis, and vulnerability mitigation.\n"
        "- Automation scripting using Python and data queries using SQL.\n"
        "- Hands-on knowledge of security tools, Linux system auditing, and security compliance.\n"
        "- Designing access controls and conducting penetration audits."
    )
}

ROLE_LIST = [
    'Software Engineer',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Data Analyst',
    'Data Scientist',
    'Machine Learning Engineer',
    'Java Developer',
    'Python Developer',
    'Mobile App Developer',
    'DevOps Engineer',
    'Cloud Engineer',
    'Cybersecurity Analyst',
    'Other / Custom Role'
]

def get_job_description(role_id_or_title: str) -> str:
    """
    Retrieves the job description matching a role ID (as string or int) or role title.
    Returns None if the role is 'Other / Custom Role' or not found.
    """
    # 1. Try resolving as integer index
    try:
        idx = int(role_id_or_title)
        if idx in JOB_DESCRIPTIONS:
            return JOB_DESCRIPTIONS[idx]
        if idx == len(ROLE_LIST) - 1: # Custom role index (13)
            return None
    except (ValueError, TypeError):
        pass

    # 2. Try resolving as role title string
    cleaned_title = str(role_id_or_title).strip().lower()
    for idx, title in enumerate(ROLE_LIST):
        if title.lower() == cleaned_title:
            if idx in JOB_DESCRIPTIONS:
                return JOB_DESCRIPTIONS[idx]
            if idx == len(ROLE_LIST) - 1: # Custom role
                return None

    return None
