#!/usr/bin/env python3
"""
Advanced Resume Parser using pyresparser
This script provides the most accurate resume parsing using pyresparser library
"""

import sys
import json
import os
from pyresparser import ResumeParser
import traceback
import re
from datetime import datetime, timedelta
import nltk
import spacy

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet')

def calculate_experience_years(experience_list):
    """
    Calculate total years of experience from experience list
    """
    if not experience_list:
        return 0
    
    total_months = 0
    current_year = datetime.now().year
    
    for exp in experience_list:
        if isinstance(exp, str):
            # Try to extract years from experience string
            # Look for patterns like "2020-2023", "Jan 2020 - Present", etc.
            year_matches = re.findall(r'\b(19|20)\d{2}\b', exp)
            if len(year_matches) >= 2:
                start_year = int(year_matches[0])
                end_year = int(year_matches[-1])
                if end_year > start_year:
                    total_months += (end_year - start_year) * 12
            elif len(year_matches) == 1:
                # Single year, assume 1 year experience
                total_months += 12
            elif 'present' in exp.lower() or 'current' in exp.lower():
                # Find start year and calculate to present
                year_match = re.search(r'\b(19|20)\d{2}\b', exp)
                if year_match:
                    start_year = int(year_match.group())
                    total_months += (current_year - start_year) * 12
    
    # Convert months to years (rounded to 1 decimal place)
    return round(total_months / 12, 1) if total_months > 0 else 0

def clean_and_format_data(data):
    """
    Clean and format the parsed resume data
    """
    cleaned_data = {}
    
    # Basic info
    cleaned_data['name'] = data.get('name', '').strip() if data.get('name') else ''
    cleaned_data['email'] = data.get('email', '').strip() if data.get('email') else ''
    cleaned_data['mobile_number'] = data.get('mobile_number', '').strip() if data.get('mobile_number') else ''
    
    # Skills - clean and deduplicate
    skills = data.get('skills', [])
    if skills:
        # Remove duplicates and clean
        unique_skills = []
        seen_skills = set()
        for skill in skills:
            if isinstance(skill, str):
                skill_clean = skill.strip().title()
                skill_lower = skill_clean.lower()
                if skill_lower not in seen_skills and len(skill_clean) > 1:
                    unique_skills.append(skill_clean)
                    seen_skills.add(skill_lower)
        cleaned_data['skills'] = unique_skills[:50]  # Limit to top 50 skills
    else:
        cleaned_data['skills'] = []
    
    # Experience
    experience = data.get('experience', [])
    cleaned_data['experience_list'] = experience if isinstance(experience, list) else []
    cleaned_data['total_experience'] = calculate_experience_years(cleaned_data['experience_list'])
    
    # Education
    education = data.get('education', [])
    if education and isinstance(education, list):
        cleaned_education = []
        for edu in education:
            if isinstance(edu, str) and edu.strip():
                cleaned_education.append(edu.strip())
        cleaned_data['education'] = cleaned_education[:10]  # Limit to 10 entries
    else:
        cleaned_data['education'] = []
    
    # College names
    college_names = data.get('college_name', [])
    if college_names and isinstance(college_names, list):
        cleaned_data['college_names'] = [name.strip() for name in college_names if isinstance(name, str) and name.strip()][:5]
    else:
        cleaned_data['college_names'] = []
    
    # Degree
    degree = data.get('degree', [])
    if degree and isinstance(degree, list):
        cleaned_data['degrees'] = [d.strip() for d in degree if isinstance(d, str) and d.strip()][:5]
    else:
        cleaned_data['degrees'] = []
    
    # Designation (job titles)
    designation = data.get('designation', [])
    if designation and isinstance(designation, list):
        cleaned_data['designations'] = [d.strip() for d in designation if isinstance(d, str) and d.strip()][:10]
    else:
        cleaned_data['designations'] = []
    
    # Company names
    company_names = data.get('company_names', [])
    if company_names and isinstance(company_names, list):
        cleaned_data['company_names'] = [name.strip() for name in company_names if isinstance(name, str) and name.strip()][:10]
    else:
        cleaned_data['company_names'] = []
    
    return cleaned_data

def extract_additional_info(file_path):
    """
    Extract additional information that pyresparser might miss
    """
    additional_info = {
        'languages': [],
        'certifications': [],
        'projects': [],
        'summary': '',
        'location': ''
    }
    
    try:
        # Read the file content for additional parsing
        if file_path.lower().endswith('.pdf'):
            from pdfminer.high_level import extract_text
            text = extract_text(file_path)
        elif file_path.lower().endswith('.docx'):
            import docx2txt
            text = docx2txt.process(file_path)
        else:
            return additional_info
        
        text_lower = text.lower()
        
        # Extract languages
        language_patterns = [
            r'languages?\s*:?\s*([^\n\r]+)',
            r'language\s+skills?\s*:?\s*([^\n\r]+)',
            r'linguistic\s+skills?\s*:?\s*([^\n\r]+)'
        ]
        
        for pattern in language_patterns:
            matches = re.findall(pattern, text_lower)
            for match in matches:
                langs = re.split(r'[,;|]', match)
                for lang in langs:
                    lang = lang.strip().title()
                    if len(lang) > 2 and lang not in additional_info['languages']:
                        additional_info['languages'].append(lang)
        
        # Extract certifications
        cert_patterns = [
            r'certifications?\s*:?\s*([^\n\r]+)',
            r'certificates?\s*:?\s*([^\n\r]+)',
            r'licensed?\s*:?\s*([^\n\r]+)'
        ]
        
        for pattern in cert_patterns:
            matches = re.findall(pattern, text_lower)
            for match in matches:
                certs = re.split(r'[,;|]', match)
                for cert in certs:
                    cert = cert.strip().title()
                    if len(cert) > 3 and cert not in additional_info['certifications']:
                        additional_info['certifications'].append(cert)
        
        # Extract projects
        project_patterns = [
            r'projects?\s*:?\s*([^\n\r]+)',
            r'personal\s+projects?\s*:?\s*([^\n\r]+)',
            r'key\s+projects?\s*:?\s*([^\n\r]+)'
        ]
        
        for pattern in project_patterns:
            matches = re.findall(pattern, text_lower)
            for match in matches:
                projects = re.split(r'[,;|]', match)
                for project in projects:
                    project = project.strip()
                    if len(project) > 5 and project not in additional_info['projects']:
                        additional_info['projects'].append(project)
        
        # Extract summary/objective
        summary_patterns = [
            r'summary\s*:?\s*([^\n\r]{20,200})',
            r'objective\s*:?\s*([^\n\r]{20,200})',
            r'profile\s*:?\s*([^\n\r]{20,200})',
            r'about\s+me\s*:?\s*([^\n\r]{20,200})'
        ]
        
        for pattern in summary_patterns:
            match = re.search(pattern, text_lower)
            if match and not additional_info['summary']:
                additional_info['summary'] = match.group(1).strip()
                break
        
        # Extract location
        location_patterns = [
            r'location\s*:?\s*([^\n\r]+)',
            r'address\s*:?\s*([^\n\r]+)',
            r'city\s*:?\s*([^\n\r]+)'
        ]
        
        for pattern in location_patterns:
            match = re.search(pattern, text_lower)
            if match and not additional_info['location']:
                location = match.group(1).strip()
                if len(location) > 2:
                    additional_info['location'] = location.title()
                    break
    
    except Exception as e:
        print(f"Error extracting additional info: {str(e)}", file=sys.stderr)
    
    return additional_info

def parse_resume(file_path):
    """
    Parse resume using pyresparser and return structured data
    """
    try:
        # Check if file exists
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Parse using pyresparser
        data = ResumeParser(file_path).get_extracted_data()
        
        if not data:
            raise ValueError("No data extracted from resume")
        
        # Clean and format the data
        cleaned_data = clean_and_format_data(data)
        
        # Extract additional information
        additional_info = extract_additional_info(file_path)
        
        # Merge additional info
        cleaned_data.update(additional_info)
        
        # Create final structured output
        result = {
            'success': True,
            'data': {
                'candidate': {
                    'name': cleaned_data.get('name', ''),
                    'email': cleaned_data.get('email', ''),
                    'phone': cleaned_data.get('mobile_number', ''),
                    'location': cleaned_data.get('location', '')
                },
                'skills': cleaned_data.get('skills', []),
                'experience': cleaned_data.get('total_experience', 0),
                'experience_list': cleaned_data.get('experience_list', []),
                'education': cleaned_data.get('education', []),
                'college_names': cleaned_data.get('college_names', []),
                'degrees': cleaned_data.get('degrees', []),
                'designations': cleaned_data.get('designations', []),
                'company_names': cleaned_data.get('company_names', []),
                'languages': cleaned_data.get('languages', []),
                'certifications': cleaned_data.get('certifications', []),
                'projects': cleaned_data.get('projects', []),
                'summary': cleaned_data.get('summary', ''),
                'parsing_method': 'pyresparser'
            }
        }
        
        return result
        
    except Exception as e:
        error_msg = f"Error parsing resume: {str(e)}"
        print(error_msg, file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        
        return {
            'success': False,
            'error': error_msg,
            'data': None
        }

def main():
    """
    Main function to handle command line arguments
    """
    if len(sys.argv) != 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python pyresumeParser.py <file_path>',
            'data': None
        }))
        sys.exit(1)
    
    file_path = sys.argv[1]
    result = parse_resume(file_path)
    print(json.dumps(result, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()

