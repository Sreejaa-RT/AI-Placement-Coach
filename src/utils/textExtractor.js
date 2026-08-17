import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set up PDF.js worker using unpkg CDN matching version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.0.379'}/build/pdf.worker.min.mjs`;

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateResumeFile(file) {
  if (!file) {
    throw new Error('No file selected.');
  }

  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];

  const lowerName = file.name.toLowerCase();
  const validExtension = lowerName.endsWith('.pdf') || lowerName.endsWith('.docx') || lowerName.endsWith('.doc');

  if (!allowedTypes.includes(file.type) && !validExtension) {
    throw new Error('Unsupported file format. Please upload a PDF (.pdf) or Word Document (.docx, .doc).');
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    throw new Error(`File is too large (${sizeInMb} MB). Maximum allowed size is 5 MB.`);
  }

  return true;
}

export async function extractTextFromFile(file) {
  validateResumeFile(file);

  const arrayBuffer = await file.arrayBuffer();
  const lowerName = file.name.toLowerCase();

  let extractedText = '';

  if (lowerName.endsWith('.pdf') || file.type === 'application/pdf') {
    try {
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;
      
      let fullText = '';
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n\n';
      }
      extractedText = fullText;
    } catch (err) {
      console.error('PDF extraction failed:', err);
      throw new Error('Failed to parse PDF text. The document may be encrypted, scanned image-only, or corrupted.');
    }
  } else if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc') || file.type.includes('word')) {
    try {
      const result = await mammoth.extractRawText({ arrayBuffer });
      extractedText = result.value || '';
      if (result.messages && result.messages.length > 0) {
        console.log('Mammoth warnings/notes:', result.messages);
      }
    } catch (err) {
      console.error('DOCX extraction failed:', err);
      throw new Error('Failed to parse Word document text. Please ensure it is a valid .docx file.');
    }
  } else {
    throw new Error('Unsupported file format for text extraction.');
  }

  const trimmedText = extractedText.trim();
  if (!trimmedText || trimmedText.length < 50) {
    throw new Error('Extracted text is too short or empty. Please ensure the document contains readable text (not scanned images).');
  }

  return trimmedText;
}
