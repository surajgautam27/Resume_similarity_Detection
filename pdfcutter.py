import os
from PyPDF2 import PdfReader, PdfWriter

def split_pdf_by_page(pdf_path, output_folder):
    os.makedirs(output_folder, exist_ok=True)
    reader = PdfReader(pdf_path)

    for i in range(len(reader.pages)):
        writer = PdfWriter()
        writer.add_page(reader.pages[i])
        output_path = os.path.join(output_folder, f'resume_page_{i+1}.pdf')
        with open(output_path, 'wb') as f:
            writer.write(f)

    print(f"Split completed: {len(reader.pages)} PDFs created in '{output_folder}'")

# Example usage:
pdf_path = "/home/suraj/Desktop/project/7th Sem Project/resume-matcher-ml/RESUME/Resume-Samples.pdf"
 # Replace with your file path
output_folder = '/home/suraj/Desktop/project/7th Sem Project/resume-matcher-ml/RESUME'  # Replace with your output folder
split_pdf_by_page(pdf_path, output_folder)
