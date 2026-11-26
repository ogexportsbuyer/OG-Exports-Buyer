import {
  formatAppDate,
  getUiLanguage,
  isRightToLeftLanguage,
  translateUi,
} from './strings.ts';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character);
}

export function brandedPdfHtml(sourceHtml: string, title: string, logoUri: string): string {
  const language = getUiLanguage();
  const direction = isRightToLeftLanguage(language) ? 'rtl' : 'ltr';
  const localizedTitle = translateUi(title, language);
  const head = sourceHtml.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
  const rawBody = sourceHtml.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? sourceHtml;
  const body = rawBody
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  const existingStyles = [...head.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)]
    .map(match => match[1]).join('\n');
  const generatedAt = formatAppDate(new Date(), { dateStyle: 'long', timeStyle: 'short' });
  const footer = translateUi(
    'Generated {date} from OG Exports account records. This document reflects the information available in your account when it was created.',
    language,
  ).replaceAll('{date}', generatedAt);

  return `<!doctype html><html lang="${escapeHtml(language)}" dir="${direction}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(localizedTitle)}</title><style>
    ${existingStyles}
    @page{size:A4;margin:18mm 14mm 20mm}
    *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
     body{margin:0;color:#183b36;background:#fff;font:11px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;direction:${direction}}
    .og-pdf{position:relative;z-index:1;max-width:800px;margin:0 auto}
    .og-pdf-watermark{position:fixed;inset:0;z-index:0;display:flex;align-items:center;justify-content:center;pointer-events:none}
    .og-pdf-watermark img{display:block;width:62vw;max-width:390px;height:auto;object-fit:contain;opacity:.045}
     .og-pdf-brand{display:flex;align-items:center;gap:14px;padding:11px 0 15px;border-top:3px solid #F0B43D;border-bottom:2px solid #0A3637;margin-bottom:21px}
    .og-pdf-brand img{width:76px;height:56px;object-fit:contain;flex-shrink:0}
     .og-pdf-kicker{display:inline-block;padding:2px 5px;border-radius:3px;background:#F0B43D;color:#0A3335;font-size:8px;font-weight:800;letter-spacing:1.35px;text-transform:uppercase}
    .og-pdf-brand h1{font-size:21px;line-height:1.25;margin:4px 0;color:#0A3637}
    .og-pdf-brand p{margin:0;color:#62746b;font-size:9px}
    .og-pdf-content{overflow-wrap:anywhere}
    table{width:100%;border-collapse:collapse}
     th,td{padding:9px 8px;border-bottom:1px solid #e2eae5;text-align:start;vertical-align:top}
    th{color:#61746a;font-size:9px;font-weight:700;letter-spacing:.5px;text-transform:uppercase}
    td{color:#173b2c}
    .og-pdf-footer{border-top:1px solid #d8e3dd;margin-top:24px;padding-top:10px;color:#6e7d75;font-size:8px}
    .receipt-summary{width:100%;margin:0 0 17px;border-collapse:separate;border-spacing:8px 0}
     .receipt-summary td{width:50%;padding:12px;border:1px solid #d9e5df;border-left:3px solid #F0B43D;border-radius:7px;background:#F5F8F5}
    .receipt-summary-label{display:block;margin-bottom:4px;color:#6a7a73;font-size:8px;font-weight:800;letter-spacing:.8px;text-transform:uppercase}
    .receipt-summary-value{display:block;color:#0A3637;font-size:15px;font-weight:800}
    .receipt-status-value{display:block;color:#0A5147;font-size:11px;font-weight:800;text-transform:capitalize}
    .receipt-section-title{margin:15px 0 5px;color:#0A3637;font-size:10px;font-weight:800;letter-spacing:.7px;text-transform:uppercase}
    .receipt-note{margin-top:12px;color:#718078;font-size:8px;line-height:1.55}
    .receipt-status-note{margin-top:12px;padding:10px 12px;border:1px solid #B7CFCD;border-radius:8px;background:#EAF2F1;color:#0A3637;font-size:9px}
    tr,.receipt-card,.section{break-inside:avoid;page-break-inside:avoid}
    </style></head><body><div class="og-pdf-watermark" aria-hidden="true"><img src="${escapeHtml(logoUri)}" alt=""></div><main class="og-pdf">
    <header class="og-pdf-brand"><img src="${escapeHtml(logoUri)}" alt="OG Exports logo"><div>
      <div class="og-pdf-kicker">${escapeHtml(translateUi('Official account document', language))}</div><h1>${escapeHtml(localizedTitle)}</h1>
      <p>${escapeHtml(translateUi('OG Exports · Global Trade · Secure Account Record', language))}</p>
    </div></header>
    <section class="og-pdf-content">${body}</section>
    <footer class="og-pdf-footer">${escapeHtml(footer)}</footer>
    </main></body></html>`;
}
