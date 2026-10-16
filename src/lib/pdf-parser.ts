export interface PdfExtractionResult {
  text: string;
  pageCount: number;
  isTruncated: boolean;
  charCount: number;
  isScannedOrEmpty: boolean;
}

export const MAX_CHAR_LIMIT = 150000;

export async function extractTextFromPdf(
  file: File,
  onProgress?: (percent: number, currentPage: number, totalPages: number) => void
): Promise<PdfExtractionResult> {
  const arrayBuffer = await file.arrayBuffer();

  // Dynamically import pdfjs-dist only on the client
  const pdfjs = await import('pdfjs-dist');

  // Set the workerSrc to a reliable CDN matching the installed version
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  let fullText = '';

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    const pageText = content.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ');

    fullText += (pageNum > 1 ? '\n\n' : '') + pageText.trim();

    if (onProgress) {
      const percent = Math.round((pageNum / numPages) * 100);
      onProgress(percent, pageNum, numPages);
    }
  }

  const trimmedText = fullText.trim();
  const isScannedOrEmpty = trimmedText.length === 0;
  const isTruncated = trimmedText.length > MAX_CHAR_LIMIT;
  const text = isTruncated ? trimmedText.slice(0, MAX_CHAR_LIMIT) : trimmedText;

  return {
    text,
    pageCount: numPages,
    isTruncated,
    charCount: trimmedText.length,
    isScannedOrEmpty,
  };
}

