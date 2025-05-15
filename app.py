import PyPDF2

def extract_text_from_pdf(pdf_path):
    with open(pdf_path,'rb') as file:
        reader= PyPDF2.PdfReader(file)
        text=''
        for page in reader.pages:
            text+= page.extract_text()
            return text
             
import re
def preprocess(text):
    text= re.sub(r'[^\x00-\x7f]',r'',text)
    text=text.lower()
    text=re.sub(r'http\S+','',text)
    text= re.sub(r'\S*@\S*\s?','',text)
    text = re.sub(r'\brt\b|cc','',text)
    text= re.sub(r'#\s+@\S+','',text)
    text= re.sub(r'^\w\s','',text)
    text = re.sub(r'\s+',' ',text).strip()
    return text

from sklearn.feature_extraction.text import CountVectorizer

def text_to_bow_vector(texts):
    vectorizer = CountVectorizer()
    vectors = vectorizer.fit_transform(texts)
    return vectors , vectorizer

from sklearn.metrics.pairwise import cosine_similarity

def calculate_similarity (vector1 , vector2):
    return cosine_similarity(vector1,vector2)

import os
def process_pdfs_in_folder(folder_path):
    resume_paths = [os.path.join(folder_path,file) for file in os.listdir(folder_path) if file.endswith('.pdf')]
    resume_text = [preprocess(extract_text_from_pdf(resume_path)) for resume_path in resume_paths]
    return resume_text , resume_paths

def match_resumes_with_job(job_desc_text ,folder_path):
    job_desc_text = preprocess(job_desc_text)
    resume_text , resume_paths = process_pdfs_in_folder(folder_path)

    all_text = [job_desc_text] + resume_text
    vectors , vectorizer = text_to_bow_vector(all_text)

    job_vector = vectors[0]
    resume_vectors = vectors[1:]

    similarities = [calculate_similarity(job_vector, resume_vector)[0][0] for resume_vector in resume_vectors]
    matched_resumes = sorted(zip(resume_paths , similarities), key=lambda x:x[1] , reverse=True)
    return matched_resumes

job_description = input("Your job description text here ")
folder_path = '/home/suraj/Desktop/project/Resume Similarity Detection/RESUME'

matched_resumes = match_resumes_with_job(job_description,folder_path)
for resume , score in matched_resumes:
    rounded_score = round(score*100)
    print(f"Resume: {resume}, Similarity Score :{rounded_score}%")


