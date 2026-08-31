import fitz
import os

def extract_text_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)

    full_text = ""

    for page in doc:
        full_text += page.get_text()

    return full_text


def process_all_pdfs(folder_path):
    all_cases = []

    for file in os.listdir(folder_path):

        if file.endswith(".pdf"):

            pdf_path = os.path.join(folder_path, file)

            text = extract_text_from_pdf(pdf_path)

            all_cases.append({
                "file_name": file,
                "text": text
            })

    return all_cases