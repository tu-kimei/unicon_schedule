import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import os from 'os';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type OCRParseResult = {
  invoiceNumber?: string | null;
  invoiceSymbol?: string | null;
  invoiceDate?: string | null;
  supplierName?: string | null;
  supplierTaxCode?: string | null;
  subtotal?: number | null;
  taxRate?: number | null;
  taxAmount?: number | null;
  totalAmount?: number | null;
  description?: string | null;
  vehiclePlate?: string | null;
  buyerName?: string | null;
  confidence?: number | null;
  raw?: any;
};

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const ROUTER9_BASE_URL = process.env.ROUTER9_BASE_URL || 'http://localhost:20128/v1';
const ROUTER9_API_KEY = process.env.ROUTER9_API_KEY || process.env.NINE_ROUTER_VISION_API_KEY || '';
const ROUTER9_MODEL = process.env.ROUTER9_OCR_MODEL || 'cc/claude-sonnet-4-6';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function extractTextFallback(fileNames: string[]): Partial<OCRParseResult> {
  const seed = fileNames.join(' ').toUpperCase();
  const invoiceNumberMatch = seed.match(/\b(\d{4,})\b/);
  const vehiclePlateMatch = seed.match(/\b\d{2}[A-Z]-?\d{3,5}\b/);

  return {
    invoiceNumber: invoiceNumberMatch?.[1] || null,
    vehiclePlate: vehiclePlateMatch?.[0] || null,
    description: fileNames.join(', '),
    confidence: 0.20,
  };
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
  };
  return mimeMap[ext] || 'application/octet-stream';
}

/**
 * Convert a PDF file to PNG images (one per page, max 3 pages).
 * Uses ImageMagick `convert` with Ghostscript backend.
 * Returns array of PNG file paths.
 */
function pdfToImages(pdfPath: string, maxPages: number = 3): string[] {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ocr-pdf-'));
  const outputPattern = path.join(tmpDir, 'page');

  try {
    // Convert PDF pages to PNG (300 DPI for good OCR quality)
    execSync(
      `convert -density 300 -quality 95 "${pdfPath}[0-${maxPages - 1}]" "${outputPattern}-%d.png"`,
      {
        timeout: 30000,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, MAGICK_THREAD_LIMIT: '1' },
      }
    );

    // Collect generated PNG files
    const pngFiles: string[] = [];
    for (let i = 0; i < maxPages; i++) {
      // ImageMagick outputs page-0.png, page-1.png, ...
      // But for single-page PDFs, it may output page-0.png directly
      const candidate = path.join(tmpDir, `page-${i}.png`);
      if (fs.existsSync(candidate)) {
        pngFiles.push(candidate);
      }
    }

    // If single page, ImageMagick might not add suffix
    if (pngFiles.length === 0) {
      const singlePage = path.join(tmpDir, 'page.png');
      if (fs.existsSync(singlePage)) {
        pngFiles.push(singlePage);
      }
    }

    console.log(`[OCR] Converted PDF to ${pngFiles.length} page image(s)`);
    return pngFiles;
  } catch (err) {
    console.error('[OCR] PDF to image conversion failed:', err);
    return [];
  }
}

/**
 * Clean up temporary files created during PDF conversion.
 */
function cleanupTmpFiles(files: string[]) {
  for (const f of files) {
    try {
      fs.unlinkSync(f);
      const dir = path.dirname(f);
      if (fs.readdirSync(dir).length === 0) {
        fs.rmdirSync(dir);
      }
    } catch { /* ignore */ }
  }
}

function fileToBase64DataUrl(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const mimeType = getMimeType(filePath);

    // If PDF, convert to PNG first (take first page only for base64)
    if (mimeType === 'application/pdf') {
      const pngFiles = pdfToImages(filePath, 2);
      if (pngFiles.length === 0) return null;

      // Return first page as PNG data URL
      const pngBuffer = fs.readFileSync(pngFiles[0]);
      // Schedule cleanup
      setTimeout(() => cleanupTmpFiles(pngFiles), 5000);
      return `data:image/png;base64,${pngBuffer.toString('base64')}`;
    }

    // For images, return directly
    const buffer = fs.readFileSync(filePath);
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  } catch (err) {
    console.error('[OCR] fileToBase64DataUrl error:', err);
    return null;
  }
}

/**
 * For PDFs with multiple pages, return multiple data URLs (one per page).
 */
function fileToBase64DataUrls(filePath: string, maxPages: number = 3): string[] {
  try {
    if (!fs.existsSync(filePath)) return [];
    const mimeType = getMimeType(filePath);

    if (mimeType === 'application/pdf') {
      const pngFiles = pdfToImages(filePath, maxPages);
      const dataUrls = pngFiles.map(pngPath => {
        const buffer = fs.readFileSync(pngPath);
        return `data:image/png;base64,${buffer.toString('base64')}`;
      });
      setTimeout(() => cleanupTmpFiles(pngFiles), 5000);
      return dataUrls;
    }

    // Single image
    const buffer = fs.readFileSync(filePath);
    return [`data:${mimeType};base64,${buffer.toString('base64')}`];
  } catch {
    return [];
  }
}

function buildOCRPrompt(): string {
  return `Bạn là chuyên gia trích xuất dữ liệu hoá đơn đầu vào (input invoice) của doanh nghiệp Việt Nam.

Hãy phân tích ảnh/file đính kèm và trích xuất các thông tin sau (nếu có):

1. **invoiceNumber** – Số hoá đơn (ví dụ: "0000123", "AA/23E-0001234")
2. **invoiceSymbol** – Ký hiệu hoá đơn (ví dụ: "1C26TAA", "AA/23E")
3. **invoiceDate** – Ngày hoá đơn (format ISO: "YYYY-MM-DD")
4. **supplierName** – Tên nhà cung cấp/đơn vị bán hàng
5. **supplierTaxCode** – Mã số thuế nhà cung cấp (10 hoặc 13 số)
6. **buyerName** – Tên đơn vị mua hàng (nếu có)
7. **subtotal** – Cộng tiền hàng (trước VAT), số nguyên VND
8. **taxRate** – Thuế suất VAT (ví dụ: 8, 10, 0)
9. **taxAmount** – Tiền thuế VAT, số nguyên VND
10. **totalAmount** – Tổng cộng thanh toán, số nguyên VND
11. **description** – Mô tả ngắn nội dung hoá đơn (dịch vụ/hàng hoá gì)
12. **vehiclePlate** – Biển số xe (nếu có, ví dụ: "51D-12345")

Quy tắc:
- Nếu không tìm thấy field nào thì trả null cho field đó.
- Số tiền phải là số nguyên (không có dấu chấm/phẩy), đơn vị VND.
- Ngày phải format ISO (YYYY-MM-DD).
- Trả về JSON object **chỉ chứa các field trên**, không giải thích thêm.
- Thêm field "confidence" từ 0 đến 100 (%) đánh giá độ tin cậy tổng thể.

Ví dụ output:
{
  "invoiceNumber": "0001234",
  "invoiceSymbol": "1C26TAA",
  "invoiceDate": "2026-03-15",
  "supplierName": "Công ty TNHH ABC",
  "supplierTaxCode": "0123456789",
  "buyerName": "Công ty Unicon",
  "subtotal": 10000000,
  "taxRate": 10,
  "taxAmount": 1000000,
  "totalAmount": 11000000,
  "description": "Dịch vụ vận chuyển hàng hoá",
  "vehiclePlate": "51D-12345",
  "confidence": 85
}

Bây giờ hãy phân tích ảnh/file đính kèm và trả về JSON.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main OCR Function
// ─────────────────────────────────────────────────────────────────────────────

export async function parseInputInvoiceWith9RouterVision(params: {
  fileUrls: string[];
  fileNames: string[];
  filePaths?: string[];
}): Promise<{ success: boolean; data: OCRParseResult; provider: string; error?: string }> {
  // Check API key
  if (!ROUTER9_API_KEY) {
    console.warn('[OCR] Missing ROUTER9_API_KEY. Using fallback parser.');
    return {
      success: false,
      provider: '9router_vision',
      error: 'Missing ROUTER9_API_KEY in environment. Using fallback parser.',
      data: extractTextFallback(params.fileNames),
    };
  }

  // Build image content for vision API
  const imageContents: Array<{ type: 'image_url'; image_url: { url: string } }> = [];

  // Prefer filePaths (local files) — convert PDFs to images automatically
  const paths = params.filePaths ?? [];
  
  for (let i = 0; i < Math.min(paths.length, 5); i++) {
    const filePath = paths[i];
    // Use multi-page extractor for PDFs
    const dataUrls = fileToBase64DataUrls(filePath, 3);
    for (const dataUrl of dataUrls) {
      imageContents.push({
        type: 'image_url',
        image_url: { url: dataUrl },
      });
    }
  }

  // Fallback: skip URL-based approach for now (Claude needs base64 images, not raw URLs)
  if (imageContents.length === 0) {
    console.warn('[OCR] No images could be extracted from files. Check file paths and PDF conversion.');
  }

  if (imageContents.length === 0) {
    console.warn('[OCR] No valid images to process. Using fallback parser.');
    return {
      success: false,
      provider: '9router_vision',
      error: 'No valid images found for OCR.',
      data: extractTextFallback(params.fileNames),
    };
  }

  // Build messages for vision API
  const messages = [
    {
      role: 'user',
      content: [
        { type: 'text', text: buildOCRPrompt() },
        ...imageContents,
      ],
    },
  ];

  try {
    console.log(`[OCR] Calling 9router vision API with model ${ROUTER9_MODEL}...`);

    const response = await fetch(`${ROUTER9_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ROUTER9_API_KEY}`,
      },
      body: JSON.stringify({
        model: ROUTER9_MODEL,
        messages,
        max_tokens: 2000,
        temperature: 0.1,
        stream: false, // Explicitly request non-streaming
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[OCR] 9router API error: ${response.status}`, errorText);
      return {
        success: false,
        provider: '9router_vision',
        error: `API error: ${response.status} - ${errorText.slice(0, 200)}`,
        data: extractTextFallback(params.fileNames),
      };
    }

    // Handle both streaming and non-streaming responses
    const contentType = response.headers.get('content-type') || '';
    let content = '';
    let usage: any = null;

    if (contentType.includes('text/event-stream')) {
      // SSE streaming — parse events
      const text = await response.text();
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.substring(6).trim();
          if (dataStr && dataStr !== '[DONE]') {
            try {
              const chunk = JSON.parse(dataStr);
              const delta = chunk.choices?.[0]?.delta?.content;
              if (delta) content += delta;
              if (chunk.usage) usage = chunk.usage;
            } catch { /* skip parse errors */ }
          }
        }
      }
    } else {
      // Regular JSON response
      const result = await response.json();
      content = result.choices?.[0]?.message?.content || '';
      usage = result.usage || null;
    }

    console.log('[OCR] Raw response content:', content.slice(0, 500));

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    } else {
      // Try to find raw JSON object
      const objMatch = content.match(/\{[\s\S]*\}/);
      if (objMatch) {
        jsonStr = objMatch[0];
      }
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('[OCR] Failed to parse JSON from response:', jsonStr.slice(0, 300));
      return {
        success: false,
        provider: '9router_vision',
        error: 'Failed to parse OCR response as JSON.',
        data: {
          ...extractTextFallback(params.fileNames),
          raw: { responseContent: content.slice(0, 1000) },
        },
      };
    }

    // Normalize confidence to 0-100 scale
    let confidence = parsed.confidence;
    if (typeof confidence === 'number') {
      if (confidence <= 1) confidence = confidence * 100; // Convert 0.85 → 85
    } else {
      confidence = 70; // Default if not provided
    }

    const ocrResult: OCRParseResult = {
      invoiceNumber: parsed.invoiceNumber || null,
      invoiceSymbol: parsed.invoiceSymbol || null,
      invoiceDate: parsed.invoiceDate || null,
      supplierName: parsed.supplierName || null,
      supplierTaxCode: parsed.supplierTaxCode || null,
      buyerName: parsed.buyerName || null,
      subtotal: typeof parsed.subtotal === 'number' ? parsed.subtotal : null,
      taxRate: typeof parsed.taxRate === 'number' ? parsed.taxRate : null,
      taxAmount: typeof parsed.taxAmount === 'number' ? parsed.taxAmount : null,
      totalAmount: typeof parsed.totalAmount === 'number' ? parsed.totalAmount : null,
      description: parsed.description || null,
      vehiclePlate: parsed.vehiclePlate || null,
      confidence,
      raw: {
        model: ROUTER9_MODEL,
        usage,
        parsedFields: parsed,
      },
    };

    console.log('[OCR] Successfully parsed invoice:', {
      invoiceNumber: ocrResult.invoiceNumber,
      supplierName: ocrResult.supplierName,
      totalAmount: ocrResult.totalAmount,
      confidence: ocrResult.confidence,
    });

    return {
      success: true,
      provider: '9router_vision',
      data: ocrResult,
    };
  } catch (err) {
    console.error('[OCR] Exception during API call:', err);
    return {
      success: false,
      provider: '9router_vision',
      error: err instanceof Error ? err.message : String(err),
      data: extractTextFallback(params.fileNames),
    };
  }
}
