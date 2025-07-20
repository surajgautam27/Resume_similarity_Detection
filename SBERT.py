# Skill Dictionary
skill_lemma_dict = {
    # Programming Languages
    "python": ["python", "py", "pandas", "numpy", "scipy", "flask", "django"],
    "java": ["java", "jvm", "spring", "hibernate", "maven", "gradle"],
    "javascript": ["javascript", "js", "node.js", "react.js", "vue.js", "angular", "typescript"],
    "csharp": ["c#", ".net", "asp.net", "entity framework"],
    "c++": ["c++", "cpp", "qt", "boost"],
    "php": ["php", "laravel", "symfony"],
    "ruby": ["ruby", "rails"],
    "go": ["go", "golang"],
    "swift": ["swift", "ios"],
    "kotlin": ["kotlin", "android"],
    "scala": ["scala", "akka", "play framework"],
    "rust": ["rust"],
    "perl": ["perl"],

    # Frameworks and Libraries
    "react": ["react", "react.js", "react native"],
    "angular": ["angular"],
    "vue": ["vue", "vue.js"],
    "jquery": ["jquery"],
    "bootstrap": ["bootstrap"],
    "express": ["express"],
    "spring boot": ["spring boot"],
    "tensorflow": ["tensorflow"],
    "keras": ["keras"],
    "pytorch": ["pytorch"],
    "scikit-learn": ["scikit-learn"],

    # Databases
    "sql": ["sql", "mysql", "postgresql", "oracle", "sql server"],
    "nosql": ["nosql", "mongodb", "cassandra", "redis", "neo4j", "couchdb"],
    "mysql": ["mysql"],
    "postgresql": ["postgresql"],
    "mongodb": ["mongodb"],
    "redis": ["redis"],
    "sqlite": ["sqlite"],
    "oracle": ["oracle"],
    "snowflake": ["snowflake"],
    "redshift": ["redshift"],
    "greenplum": ["greenplum"],
    "teradata": ["teradata"],

    # DevOps and Cloud Platforms
    "aws": ["aws", "ec2", "s3", "lambda", "rds"],
    "azure": ["azure", "azure devops"],
    "google cloud": ["google cloud", "gcp", "app engine", "kubernetes engine"],
    "docker": ["docker", "docker-compose"],
    "kubernetes": ["kubernetes", "k8s"],
    "jenkins": ["jenkins"],
    "travis ci": ["travis ci"],
    "gitlab ci": ["gitlab ci"],
    "circleci": ["circleci"],

    # Web Technologies
    "html": ["html"],
    "css": ["css", "sass", "less"],
    "rest api": ["rest", "restful", "json", "xml"],
    "graphql": ["graphql"],

    # Software Development Methodologies
    "agile": ["agile", "scrum", "kanban"],
    "devops": ["devops", "site reliability"],

    # Soft Skills
    "leadership": ["leadership", "management"],
    "communication": ["communication", "teamwork"],
    "problem-solving": ["problem-solving", "analytical skills"],
    "adaptability": ["adaptability", "flexibility"],
    "teamwork": ["teamwork"],
    "leadership": ["leadership"],
    "project management": ["project management", "pm"],
    "creativity": ["creativity"],
    "critical thinking": ["critical thinking"],
    "emotional intelligence": ["emotional intelligence", "eq"],
    "negotiation": ["negotiation"],
    "decision making": ["decision making"],

    # Machine Learning
    "machine learning": ["machine learning", "ml"],
    "deep learning": ["deep learning", "dl"],
    "reinforcement learning": ["reinforcement learning", "rl"],
    "supervised learning": ["supervised learning"],
    "unsupervised learning": ["unsupervised learning"],
    "semi-supervised learning": ["semi-supervised learning"],
    "natural language processing": ["natural language processing", "nlp"],
    "computer vision": ["computer vision"],
    "speech recognition": ["speech recognition"],
    "anomaly detection": ["anomaly detection"],
    "generative adversarial networks": ["gan", "generative adversarial networks"],
    "transfer learning": ["transfer learning"],
    "feature engineering": ["feature engineering"],
    "model optimization": ["model optimization"],
    "model deployment": ["model deployment"],
    "edge AI": ["edge ai", "edge computing"],
    "federated learning": ["federated learning"],
    "explainable AI": ["explainable ai", "xai"],

    # ML Frameworks and Libraries
    "tensorflow": ["tensorflow", "tf"],
    "keras": ["keras"],
    "pytorch": ["pytorch"],
    "scikit-learn": ["scikit-learn", "sklearn"],
    "pandas": ["pandas"],
    "numpy": ["numpy"],
    "scipy": ["scipy"],
    "matplotlib": ["matplotlib"],
    "seaborn": ["seaborn"],
    "xgboost": ["xgboost"],
    "lightgbm": ["lightgbm"],
    "opencv": ["opencv"],
    "spacy": ["spacy"],
    "nltk": ["nltk"],
    "gensim": ["gensim"],
    "huggingface": ["huggingface", "transformers"],
    "fastai": ["fastai"],
    "caffe": ["caffe"],
    "theano": ["theano"],
    "dlib": ["dlib"],
    "mlflow": ["mlflow"],
    "pycaret": ["pycaret"],
    "streamlit": ["streamlit"],
    "dash": ["dash"],

    # Time Series Analysis & Forecasting
    "time series": ["time series", "time series analysis"],
    "arima": ["arima"],
    "prophet": ["prophet"],
    "lstm": ["lstm"],

    # Deep Learning Specific Technologies
    "convolutional neural networks": ["cnn", "convolutional neural networks"],
    "recurrent neural networks": ["rnn", "recurrent neural networks"],
    "long short-term memory": ["lstm"],
    "transformers": ["transformers"],
    "bert": ["bert"],
    "gpt": ["gpt", "gpt-2", "gpt-3"],

    # Visualization and Reporting Tools
    "tableau": ["tableau"],
    "power bi": ["power bi"],
    "qlik": ["qlik", "qlikview", "qliksense"],
    "looker": ["looker"],

    # Big Data
    "big data": ["big data"],
    "hadoop": ["hadoop"],
    "spark": ["spark"],
    "kafka": ["kafka"],
    "hive": ["hive"],
    "flink": ["flink"],
    "elastic search": ["elastic search", "elasticsearch"],
    "solr": ["solr"],
    "cassandra": ["cassandra"],
    "hbase": ["hbase"],
    "neo4j": ["neo4j"],

    # Cloud and DevOps
    "aws": ["aws", "amazon web services"],
    "azure": ["azure"],
    "gcp": ["gcp", "google cloud platform"],
    "docker": ["docker"],
    "kubernetes": ["kubernetes", "k8s"],
    "jenkins": ["jenkins"],
    "ci/cd": ["ci/cd", "continuous integration", "continuous deployment"],
    "terraform": ["terraform"],
    "ansible": ["ansible"],
    "cloudformation": ["cloudformation"],
    "openstack": ["openstack"],

    # Data Engineering and ETL Tools
    "airflow": ["airflow"],
    "luigi": ["luigi"],
    "talend": ["talend"],
    "pentaho": ["pentaho"],
    "informatica": ["informatica"],

    # Miscellaneous
    "git": ["git", "version control", "svn"],
    "project management": ["jira", "trello", "asana"],
    "ui/ux": ["ui", "ux", "user interface", "user experience"],
    "cybersecurity": ["cybersecurity", "penetration testing", "encryption"],
    "data analysis": ["data analysis", "excel", "power bi", "tableau", "data analytics"],
    "data visualization": ["data visualization"],
    "data mining": ["data mining"],
    "statistical analysis": ["statistical analysis", "statistics"],
    "ethics in AI": ["ethics in ai", "ai ethics"],
    "quantum computing": ["quantum computing"],
    "blockchain": ["blockchain"],
    "augmented reality": ["augmented reality", "ar"],
    "virtual reality": ["virtual reality", "vr"],
    "internet of things": ["iot", "internet of things"],
    "robotics": ["robotics"],
    "drones": ["drones", "uav"],
    "penetration testing": ["penetration testing"],
    "blockchain": ["blockchain"],
    "cryptocurrency": ["cryptocurrency", "bitcoin", "ethereum"],
    "quantum computing": ["quantum computing"],
    "bioinformatics": ["bioinformatics"],
    "digital twin": ["digital twin"],
    "autonomous vehicles": ["autonomous vehicles", "self-driving cars"]
}

# Import necessary libraries
import os
import re
import PyPDF2
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import spacy

# Load SBERT model
sbert_model = SentenceTransformer('all-MiniLM-L6-v2')

# Load SpaCy model for lemmatization
nlp = spacy.load("en_core_web_sm")

# Function to extract text from PDF
def extract_text_from_pdf(file_path):
    text = ''
    try:
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"Error processing file {file_path}: {e}")
    return text.strip()


# Function to lemmatize text and extract skills
def extract_skills_lemma(text):
    doc = nlp(text.lower())
    extracted_skills = set()
    for token in doc:
        for skill, lemmas in skill_lemma_dict.items():
            if token.lemma_ in lemmas:
                extracted_skills.add(skill)
    return extracted_skills

# Function to calculate similarity with SBERT
def calculate_similarity_sbert(text1, text2):
    # Encode the texts directly to embeddings
    embeddings1 = sbert_model.encode([text1])
    embeddings2 = sbert_model.encode([text2])

    # Calculate cosine similarity without adding an extra list layer
    similarity = cosine_similarity(embeddings1, embeddings2)[0][0]
    return similarity

# Process Resumes and Job Description
def process_resumes_and_job_description(job_description, folder_path):
    job_desc_text = job_description
    job_desc_skills = extract_skills_lemma(job_desc_text)
    print(f"Job Description Skills: {job_desc_skills}")

    # Initialize a list to store tuples of (filename, similarity score, extracted skills)
    resume_scores = []

    for filename in os.listdir(folder_path):
        if filename.endswith(".pdf"):
            pdf_path = os.path.join(folder_path, filename)
            resume_text = extract_text_from_pdf(pdf_path)
            resume_skills = extract_skills_lemma(resume_text)
            similarity_score = calculate_similarity_sbert(job_desc_text, resume_text)

            # Append a tuple with the necessary info to the list
            resume_scores.append((filename, similarity_score, resume_skills))

    # Sort the list of tuples by the similarity score in descending order
    sorted_resumes = sorted(resume_scores, key=lambda x: x[1], reverse=True)

    # Print the sorted resumes
    for filename, similarity_score, extracted_skills in sorted_resumes:
        print(f"Resume: {filename}\nSimilarity Score: {similarity_score:.4f}\nExtracted Skills: {extracted_skills}\n")

job_description = "SQL, javascript, HTML, Java, CSS,python"
folder_path = '/home/suraj/Desktop/project/7th Sem Project/resume-matcher-ml/resumes'
 
process_resumes_and_job_description(job_description, folder_path)



