# Function to Extract Text from PDF
import PyPDF2

def extract_text_from_pdf(pdf_path):
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ''
        for page in reader.pages:
            text += page.extract_text()
    return text

# Preprocessing Function
import re

def preprocess(text):
    # Remove non-ASCII characters
    text = re.sub(r'[^\x00-\x7f]', r' ', text)

    # Lowercase the text for uniformity
    text = text.lower()

    # Remove URLs
    text = re.sub(r'http\S+', ' ', text)

    # Remove email addresses
    text = re.sub(r'\S*@\S*\s?', '', text)

    # Remove Twitter-specific artifacts like RT (retweet) and cc
    text = re.sub(r'\brt\b|cc', ' ', text)

    # Remove hashtags and mentions
    text = re.sub(r'#\S+|@\S+', ' ', text)

    # Remove punctuations and special characters
    text = re.sub(r'[^\w\s]', ' ', text)
    
    # Replace multiple spaces with a single space
    text = re.sub(r'\s+', ' ', text).strip()

    return text


# Convert Text to Bag of Words Vectors
from sklearn.feature_extraction.text import CountVectorizer

def text_to_bow_vector(texts):
    vectorizer = CountVectorizer()
    
    vectors = vectorizer.fit_transform(texts)
    print(vectors)
    return vectors, vectorizer

# Similarity Calculation Function
from sklearn.metrics.pairwise import cosine_similarity
def calculate_similarity(vector1, vector2):
    return cosine_similarity(vector1, vector2)

# Function to Process PDFs in a Folder
import os
def process_pdfs_in_folder(folder_path):
    resume_paths = [os.path.join(folder_path, file) for file in os.listdir(folder_path) if file.endswith('.pdf')]
    resumes_text = [preprocess(extract_text_from_pdf(resume_path)) for resume_path in resume_paths]
    return resumes_text, resume_paths

# Function to Match Job Description with Resumes
def match_resumes_with_job(job_desc_text, folder_path):
    job_desc_text = preprocess(job_desc_text)
    resumes_text, resume_paths = process_pdfs_in_folder(folder_path)

    all_text = [job_desc_text] + resumes_text
    vectors, vectorizer = text_to_bow_vector(all_text)

    job_vector = vectors[0]
    resume_vectors = vectors[1:]

    similarities = [calculate_similarity(job_vector, resume_vector)[0][0] for resume_vector in resume_vectors]

    matched_resumes = sorted(zip(resume_paths, similarities), key=lambda x: x[1], reverse=True)
    
    return matched_resumes


# Implementation
job_description = input("Your job description text here")
folder_path = 'RESUME'


matched_resumes = match_resumes_with_job(job_description, folder_path)
for resume, score in matched_resumes:
    rounded_score = round(score * 100)  # Convert to percentage and round
    print(f"Resume: {resume}, Similarity Score: {rounded_score}%")


