import os
from pypdf import PdfReader
import docx

MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB

def validate_file_metadata(filename: str, file_size: int):
    """
    Validates file extension and size constraints.
    Raises ValueError on failure.
    """
    if not filename:
        raise ValueError("Filename is missing.")
    
    lower_name = filename.lower()
    if not (lower_name.endswith('.pdf') or lower_name.endswith('.docx')):
        raise ValueError("Unsupported file format. Please upload a PDF (.pdf) or Word Document (.docx).")
    
    if file_size > MAX_FILE_SIZE_BYTES:
        size_mb = file_size / (1024 * 1024)
        raise ValueError(f"File size exceeds maximum limit of 5 MB (Current size: {size_mb:.2f} MB).")

def extract_text_from_stream(file_stream, filename: str) -> str:
    """
    Extracts raw text from a PDF or DOCX file stream.
    Raises ValueError if extraction fails, or if no readable text is found.
    """
    lower_name = filename.lower()
    text = ""
    
    if lower_name.endswith('.pdf'):
        try:
            reader = PdfReader(file_stream)
            extracted_pages = []
            for idx, page in enumerate(reader.pages):
                page_text = page.extract_text()
                if page_text:
                    extracted_pages.append(page_text)
            text = "\n\n".join(extracted_pages)
        except Exception as e:
            raise ValueError(f"Failed to parse PDF document: {str(e)}")
            
    elif lower_name.endswith('.docx'):
        try:
            doc = docx.Document(file_stream)
            extracted_paragraphs = [para.text for para in doc.paragraphs if para.text]
            text = "\n".join(extracted_paragraphs)
        except Exception as e:
            raise ValueError(f"Failed to parse Word document: {str(e)}")
    else:
        raise ValueError("Unsupported file extension for parsing.")
        
    cleaned_text = text.strip()
    if not cleaned_text or len(cleaned_text) < 50:
        raise ValueError(
            "Extracted text is too short or empty. Please ensure the document contains readable text (scanned image-only PDFs are not supported)."
        )
        
    return cleaned_text
