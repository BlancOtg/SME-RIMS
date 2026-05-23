const { createWorker } = require('tesseract.js');
const pdfParse         = require('pdf-parse');
const fs               = require('fs');

// ── Text parser ───────────────────────────────────────────────────
function parseReceiptText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // Amount: look for Total/Amount Due patterns first, then any currency amount
  const amountPatterns = [
    /(?:total|amount\s*due|grand\s*total|balance\s*due|net\s*amount)[^\d]*([\d,]+\.?\d*)/i,
    /(?:NGN|₦|\$|£|€)\s*([\d,]+\.?\d*)/i,
    /([\d,]+\.\d{2})/,
  ];
  let amount = null;
  for (const p of amountPatterns) {
    const m = text.match(p);
    if (m) { amount = parseFloat(m[1].replace(/,/g, '')); break; }
  }

  // Date: try common formats
  const datePatterns = [
    /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/,
    /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\.?\s+\d{2,4})\b/i,
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\.?\s+\d{1,2},?\s+\d{4})\b/i,
    /\b(\d{4}[\/\-]\d{2}[\/\-]\d{2})\b/,
  ];
  let date = '';
  for (const p of datePatterns) {
    const m = text.match(p);
    if (m) { date = m[1]; break; }
  }

  // Vendor: first substantial line that doesn't look like a field label
  const skipPattern = /^(receipt|invoice|date|amount|total|ref|tax|vat|sub|phone|tel|address|www|http)/i;
  const vendor = lines.find(l => l.length > 3 && !skipPattern.test(l)) || '';

  // Reference/receipt number
  const refMatch = text.match(
    /(?:receipt|invoice|ref(?:erence)?|order|transaction|r(?:ec)?\.?\s*no)[^\w#]*[#:]?\s*([A-Z0-9\-]{3,})/i,
  );
  const reference = refMatch ? refMatch[1] : '';

  // Line items: look for "description ... amount" patterns
  const items = [];
  const itemPattern = /^(.{3,40}?)\s{2,}([\d,]+\.\d{2})\s*$/gm;
  let m;
  while ((m = itemPattern.exec(text)) !== null) {
    const desc = m[1].trim();
    const amt  = parseFloat(m[2].replace(/,/g, ''));
    if (desc && amt && amt !== amount) items.push({ description: desc, amount: amt });
  }

  return { vendor, date, amount, reference, items: items.slice(0, 10) };
}

// ── Image OCR via Tesseract ───────────────────────────────────────
async function processImage(filePath) {
  const worker = await createWorker('eng', 1, { logger: () => {} });
  try {
    const { data } = await worker.recognize(filePath);
    return { text: data.text, confidence: Math.round(data.confidence) };
  } finally {
    await worker.terminate();
  }
}

// ── PDF text extraction ───────────────────────────────────────────
async function processPdf(filePath) {
  const buffer = fs.readFileSync(filePath);
  const { text, numpages } = await pdfParse(buffer, { max: 1 });
  // Text-based PDFs return clean text at high confidence;
  // scanned PDFs return near-empty text — mark low confidence
  const confidence = text.trim().length > 30 ? 85 : 20;
  return { text, confidence };
}

// ── Main entry — called after Receipt.create ──────────────────────
async function processReceipt(receiptId, file) {
  const Receipt = require('../models/Receipt');

  try {
    await Receipt.findByIdAndUpdate(receiptId, { 'ocr.status': 'processing' });

    let result;
    if (file.mimeType === 'application/pdf') {
      result = await processPdf(file.path);
    } else {
      result = await processImage(file.path);
    }

    const extractedData = parseReceiptText(result.text);
    const highConf      = result.confidence >= 90;

    const update = {
      'ocr.status':        highConf ? 'processed' : 'needs_review',
      'ocr.confidence':    result.confidence,
      'ocr.processedAt':   new Date(),
      'ocr.extractedData': extractedData,
    };

    // Auto-apply only when confidence is high enough
    if (highConf) {
      if (extractedData.amount)    update.amount               = extractedData.amount;
      if (extractedData.vendor)    update['vendorSnapshot.name'] = extractedData.vendor;
      if (extractedData.reference) update.reference             = extractedData.reference;
      if (extractedData.date) {
        const parsed = new Date(extractedData.date);
        if (!isNaN(parsed)) update.date = parsed;
      }
    }

    await Receipt.findByIdAndUpdate(receiptId, update);
    console.log(`[OCR] Receipt ${receiptId}: confidence=${result.confidence}%, status=${update['ocr.status']}`);
  } catch (err) {
    console.error(`[OCR] Failed for receipt ${receiptId}:`, err.message);
    await Receipt.findByIdAndUpdate(receiptId, {
      'ocr.status': 'needs_review',
      'ocr.confidence': 0,
    }).catch(() => {});
  }
}

module.exports = { processReceipt };
