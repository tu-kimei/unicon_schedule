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

function extractTextFallback(fileNames: string[]): Partial<OCRParseResult> {
  const seed = fileNames.join(' ').toUpperCase();
  const invoiceNumberMatch = seed.match(/\b(\d{4,})\b/);
  const vehiclePlateMatch = seed.match(/\b\d{2}[A-Z]-?\d{3,5}\b/);

  return {
    invoiceNumber: invoiceNumberMatch?.[1] || null,
    vehiclePlate: vehiclePlateMatch?.[0] || null,
    description: fileNames.join(', '),
    confidence: 0.35,
  };
}

export async function parseInputInvoiceWith9RouterVision(params: {
  fileUrls: string[];
  fileNames: string[];
}): Promise<{ success: boolean; data: OCRParseResult; provider: string; error?: string }> {
  const apiKey = process.env.NINE_ROUTER_VISION_API_KEY || process.env.ROUTER9_VISION_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      provider: '9router_vision',
      error: 'Missing 9router vision API key. Using safe fallback parser.',
      data: extractTextFallback(params.fileNames),
    };
  }

  // TODO: integrate real 9router vision endpoint when API contract is available.
  // Phase 1 must not block the workflow, so we keep this provider mockable and safe.
  return {
    success: true,
    provider: '9router_vision',
    data: {
      ...extractTextFallback(params.fileNames),
      confidence: 0.45,
      raw: {
        mocked: true,
        reason: '9router vision scaffold only in phase 1',
        fileUrls: params.fileUrls,
      },
    },
  };
}
