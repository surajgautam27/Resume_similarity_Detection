import PyPDF2
import re
import os
import sys
import json
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def extract_text_from_pdf(pdf_path):
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ''
        for page in reader.pages:
            text += page.extract_text()
        return text

def preprocess(text):
    text = re.sub(r'[^\x00-\x7f]', r'', text)
    text = text.lower()
    text = re.sub(r'http\S+', '', text)
    text = re.sub(r'\S*@\S*\s?', '', text)
    text = re.sub(r'\brt\b|cc', '', text)
    text = re.sub(r'#\s+@\S+', '', text)
    text = re.sub(r'^\w\s', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def process_pdfs_in_folder(folder_path):
    resume_paths = [os.path.join(folder_path, file) for file in os.listdir(folder_path) if file.endswith('.pdf')]
    resume_texts = []
    valid_resume_paths = []
    
    for resume_path in resume_paths:
        try:
            text = extract_text_from_pdf(resume_path)
            if text.strip():  # Only include if text was extracted
                resume_texts.append(preprocess(text))
                valid_resume_paths.append(resume_path)
        except Exception as e:
            print(f"Error processing {resume_path}: {str(e)}")
    
    return resume_texts, valid_resume_paths

def match_resumes_with_job(job_desc_text, folder_path):
    job_desc_text = preprocess(job_desc_text)
    resume_texts, resume_paths = process_pdfs_in_folder(folder_path)

    if not resume_texts:
        return []

    all_texts = [job_desc_text] + resume_texts
    vectorizer = CountVectorizer()
    vectors = vectorizer.fit_transform(all_texts)

    job_vector = vectors[0]
    resume_vectors = vectors[1:]

    similarities = [cosine_similarity(job_vector, resume_vector)[0][0] for resume_vector in resume_vectors]
    
    # Prepare results with original filenames
    results = []
    for path, score in zip(resume_paths, similarities):
        filename = os.path.basename(path)
        # Remove timestamp if present (format: timestamp-filename.pdf)
        if filename.count('-') >= 1:
            try:
                # Check if the first part is a timestamp
                timestamp_part = filename.split('-')[0]
                if timestamp_part.isdigit() and len(timestamp_part) >= 10:
                    filename = '-'.join(filename.split('-')[1:])
            except:
                pass
                
        results.append({
            "resume": filename,
            "score": round(score * 100, 2)
        })
    
    return sorted(results, key=lambda x: x['score'], reverse=True)

if __name__ == "__main__":
    # Get arguments from Node.js
    job_description = sys.argv[1]
    folder_path = sys.argv[2]
    
    # Process and get results
    results = match_resumes_with_job(job_description, folder_path)
    
    # Output results as JSON string
    print(json.dumps(results))