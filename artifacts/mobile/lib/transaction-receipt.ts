import { resolveTransactionPaymentMethod } from './transaction-payment-method';
import { saveHtmlAsPdf } from './pdf-export';
import { formatUiStatus, getAppLocale, getUiLanguage, isRightToLeftLanguage, translateUi, type AppLanguage } from './strings.ts';

export type TransactionReceiptKind = 'deposit' | 'withdrawal' | 'investment' | 'transaction';

export type TransactionReceipt = {
  kind: TransactionReceiptKind;
  language: AppLanguage;
  title: string;
  reference: string;
  recordId: string;
  amount: string;
  currency: string;
  status: string;
  submittedAt: string;
  settlementAt: string;
  paymentMethod: string;
  paymentReference: string;
  projectReference: string;
  fee: string;
  feeCurrency: string;
  totalDebit: string;
  totalDebitCurrency: string;
  statusNote: string;
  details: Array<[string, string]>;
  filename: string;
};

type ReceiptRecord = Record<string, unknown>;

function asRecord(value: unknown): ReceiptRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as ReceiptRecord
    : {};
}

function rawText(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function recordsFor(value: unknown): ReceiptRecord[] {
  const outer = asRecord(value);
  const data = asRecord(outer.data);
  const detail = asRecord(
    data.investment ?? data.position ?? data.deposit ?? data.withdrawal
    ?? outer.investment ?? outer.position ?? outer.deposit ?? outer.withdrawal,
  );
  return [detail, data, outer].filter((item, index, all) => item !== all[index - 1]);
}

function firstServerValue(records: ReceiptRecord[], keys: string[]): string {
  for (const item of records) {
    for (const key of keys) {
      const value = rawText(item[key]);
      if (value) return value;
    }
  }
  return '';
}

function paymentMethodSources(records: ReceiptRecord[]): ReceiptRecord[] {
  return records.flatMap(item => [
    item,
    asRecord(item.withdrawal_breakdown),
    asRecord(item.bank_details),
    asRecord(item.meta),
  ]);
}

function statusExplanation(kind: TransactionReceiptKind, status: string, language: AppLanguage): string {
  const normalized = status.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!normalized) return translateUi('OG Exports did not provide a status. Settlement is not confirmed.', language);
  const kindLabel = translateUi(kind[0].toUpperCase() + kind.slice(1), language);
  const localizedStatus = formatUiStatus(status, language);
  const fill = (template: string) => translateUi(template, language)
    .replaceAll('{kind}', kindLabel)
    .replaceAll('{status}', localizedStatus);

  const completedStatuses = kind === 'deposit'
    ? ['credited', 'completed', 'settled']
    : kind === 'withdrawal'
      ? ['settled', 'completed', 'paid', 'paid out', 'transferred']
      : ['completed', 'settled', 'confirmed', 'success', 'successful'];
  if (completedStatuses.includes(normalized)) {
    return kind === 'withdrawal'
      ? fill('OG Exports reports this withdrawal as {status}. This receipt records the server status but does not independently verify receipt by an external bank.')
      : fill('OG Exports reports this {kind} as {status}. This receipt records the status returned by OG Exports.');
  }
  if (['approved', 'active'].includes(normalized)) {
    return kind === 'deposit'
      ? fill('OG Exports reports this deposit as {status}. Approval does not confirm that the wallet was credited.')
      : kind === 'withdrawal'
        ? fill('OG Exports reports this withdrawal as {status}. Approval does not confirm that funds were transferred.')
        : fill('OG Exports reports this investment as {status}. Approval does not mean the investment is settled or complete.');
  }
  if (['rejected', 'declined', 'failed', 'error', 'cancelled', 'canceled'].includes(normalized)) {
    return fill('OG Exports reports this {kind} as {status}. This receipt does not claim completion or settlement.');
  }
  return fill('This receipt records a {kind} request and its current server status ({status}); submission does not confirm settlement or a funds transfer.');
}

function safeFilename(value: string): string {
  return value.replace(/[^a-z0-9_-]/gi, '-').replace(/-+/g, '-').slice(0, 70);
}

export function createTransactionReceipt(kind: TransactionReceiptKind, value: unknown): TransactionReceipt {
  const language = getUiLanguage();
  const records = recordsFor(value);
  const project = records.map(item => asRecord(item.project)).find(item => Object.keys(item).length > 0) ?? {};
  const projectMeta = asRecord(project.meta);
  const trade = records.map(item => asRecord(item.trade)).find(item => Object.keys(item).length > 0) ?? {};
  const statusKeys = kind === 'deposit'
    ? ['review_status', 'status', 'state']
    : kind === 'withdrawal'
      ? ['status', 'state', 'withdrawal_status']
      : ['status', 'state', 'investment_status'];
  const reference = firstServerValue(records, ['reference', 'deposit_reference', 'withdraw_id', 'investment_reference', 'transaction_reference']);
  const recordId = firstServerValue(records, ['id', 'deposit_id', 'withdrawal_id', 'investment_id', 'transaction_id']);
  const status = firstServerValue(records, statusKeys);
  const amount = firstServerValue(records, kind === 'investment' ? ['amount', 'investment_amount', 'invested_amount'] : ['amount']);
  const currency = firstServerValue(records, ['currency', 'amount_currency', 'original_currency', 'wallet_currency']);
  const filenameId = safeFilename(reference || recordId);

  const title = kind === 'deposit'
    ? 'Deposit request receipt'
    : kind === 'withdrawal'
      ? 'Withdrawal request receipt'
      : kind === 'investment'
        ? 'Investment request receipt'
        : 'Transaction receipt';

  return {
    kind,
    language,
    title: translateUi(title, language),
    reference,
    recordId,
    amount,
    currency,
    status,
    submittedAt: firstServerValue(records, ['created_at', 'submitted_at', 'invested_at', 'date']),
    settlementAt: firstServerValue(records, ['settled_at', 'completed_at', 'credited_at', 'paid_at', 'transferred_at']),
    paymentMethod: kind === 'withdrawal'
      ? resolveTransactionPaymentMethod(paymentMethodSources(records), true, '')
      : '',
    paymentReference: firstServerValue(records, ['bank_reference', 'transfer_reference', 'payment_reference']),
    projectReference: firstServerValue(records, ['trade_reference', 'trade_id', 'project_reference'])
      || firstServerValue([project, projectMeta], ['reference', 'trade_reference', 'trade_id']),
    fee: kind === 'withdrawal' ? firstServerValue(records, ['fee', 'withdrawal_fee']) : '',
    feeCurrency: kind === 'withdrawal' ? firstServerValue(records, ['fee_currency', 'currency', 'wallet_currency']) : '',
    totalDebit: kind === 'withdrawal' ? firstServerValue(records, ['total_debit']) : '',
    totalDebitCurrency: kind === 'withdrawal' ? firstServerValue(records, ['total_debit_currency', 'wallet_currency', 'currency']) : '',
    statusNote: statusExplanation(kind, status, language),
    details: ([
      ['Investor', firstServerValue(records, ['investor_name', 'account_holder_name', 'customer_name'])],
      ['Record description', firstServerValue(records, ['description', 'title', 'name'])],
      ['Payment method', firstServerValue(paymentMethodSources(records), ['payment_method', 'method', 'payment_method_name'])],
      ['Trade / project', firstServerValue([project, trade, ...records], ['project_name', 'trade_name', 'title', 'name', 'commodity_name', 'commodity'])],
      ['Container', firstServerValue([project, trade, ...records], ['container_number', 'container_no', 'container_code'])],
      ['Transaction type', firstServerValue(records, ['type', 'transaction_type', 'category'])],
    ] as Array<[string, string]>).filter(([, detail]) => Boolean(detail)).map(([label, detail]) => [translateUi(label, language), detail]),
    filename: `og-exports-${kind}-${filenameId || 'receipt'}-${language}`,
  };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character);
}

function receiptRows(receipt: TransactionReceipt): Array<[string, string]> {
  const t = (source: string) => translateUi(source, receipt.language);
  const notProvided = t('Not provided');
  const dateValue = (value: string) => {
    const parsed = new Date(value);
    if (!Number.isFinite(parsed.getTime())) return value;
    const dateStyle: Intl.DateTimeFormatOptions = value.includes('T')
      ? { dateStyle: 'medium', timeStyle: 'short' }
      : { dateStyle: 'medium' };
    return new Intl.DateTimeFormat(getAppLocale(receipt.language), dateStyle).format(parsed);
  };
  return [
    [t('Server reference'), receipt.reference || notProvided],
    [t('Record ID'), receipt.recordId || notProvided],
    [t('Date returned by OG Exports'), receipt.submittedAt ? dateValue(receipt.submittedAt) : notProvided],
    [t('Settlement date returned by OG Exports'), receipt.settlementAt ? dateValue(receipt.settlementAt) : notProvided],
    ...(receipt.kind === 'withdrawal' ? [
      [t('Payout method'), receipt.paymentMethod ? translateUi(formatUiStatus(receipt.paymentMethod, receipt.language), receipt.language) : notProvided] as [string, string],
    ] : []),
    [t('Bank / payment reference'), receipt.paymentReference || notProvided],
    [t('Project / trade reference'), receipt.projectReference || notProvided],
    ...(receipt.kind === 'withdrawal' ? [
      [t('Withdrawal fee'), receipt.fee !== ''
        ? `${receipt.fee}${receipt.feeCurrency ? ` ${receipt.feeCurrency}` : ` (${t('currency not provided')})`}`
        : notProvided] as [string, string],
      [t('Total wallet debit'), receipt.totalDebit !== ''
        ? `${receipt.totalDebit}${receipt.totalDebitCurrency ? ` ${receipt.totalDebitCurrency}` : ` (${t('currency not provided')})`}`
        : notProvided] as [string, string],
    ] : []),
  ];
}

export function transactionReceiptHtml(receipt: TransactionReceipt): string {
  const t = (source: string) => translateUi(source, receipt.language);
  const rows = [...receiptRows(receipt), ...receipt.details].map(([label, value]) =>
    `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`,
  ).join('');
  const parsedAmount = Number(receipt.amount);
  const displayAmount = receipt.amount && Number.isFinite(parsedAmount)
    ? new Intl.NumberFormat(getAppLocale(receipt.language), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parsedAmount)
    : receipt.amount || t('Not provided');
  const amount = receipt.currency && receipt.amount
    ? `${displayAmount} ${receipt.currency}`
    : displayAmount;
  const direction = isRightToLeftLanguage(receipt.language) ? 'rtl' : 'ltr';
  return `<!doctype html>
<html lang="${escapeHtml(receipt.language)}" dir="${direction}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(receipt.title)}</title>
  <style>
    main{padding:0}
    .receipt-summary{width:100%;margin:0 0 16px;border-collapse:separate;border-spacing:8px 0}
     .receipt-summary td{width:50%;padding:12px;border:1px solid #d9e5df;border-left:3px solid #F0B43D;border-radius:8px;background:#F5F8F5}
    .receipt-summary-label{display:block;margin-bottom:4px;color:#6a7a73;font-size:8px;font-weight:800;letter-spacing:.8px;text-transform:uppercase}
    .receipt-summary-value{display:block;color:#0A3637;font-size:15px;font-weight:800}
    .receipt-status-value{display:block;color:#0A5147;font-size:11px;font-weight:800;text-transform:capitalize}
    .receipt-section-title{margin:15px 0 5px;color:#0A3637;font-size:9px;font-weight:800;letter-spacing:.8px;text-transform:uppercase}
    .receipt-details{width:100%;border-collapse:collapse}
     .receipt-details th,.receipt-details td{padding:8px 7px;border-bottom:1px solid #e2eae5;text-align:start;vertical-align:top;overflow-wrap:anywhere}
    .receipt-details th{width:42%;color:#607168;font-size:8px;font-weight:700;letter-spacing:.4px;text-transform:uppercase}
     .receipt-details td{text-align:end;color:#183b36;font-size:9px;font-weight:650}
    .receipt-status-note{margin-top:12px;padding:10px 12px;border:1px solid #B7CFCD;border-radius:8px;background:#EAF2F1;color:#0A3637;font-size:9px}
    .receipt-note{margin-top:10px;color:#718078;font-size:8px;line-height:1.5}
  </style>
</head>
<body style="direction:${direction}">
  <table class="receipt-summary"><tbody><tr>
    <td><span class="receipt-summary-label">${escapeHtml(t('Recorded amount'))}</span><span class="receipt-summary-value">${escapeHtml(amount)}</span></td>
    <td><span class="receipt-summary-label">${escapeHtml(t('Server status'))}</span><span class="receipt-status-value">${escapeHtml(receipt.status ? formatUiStatus(receipt.status, receipt.language) : t('Not provided'))}</span></td>
  </tr></tbody></table>
  <div class="receipt-section-title">${escapeHtml(t('Transaction details'))}</div>
  <table class="receipt-details"><tbody>${rows}</tbody></table>
  <div class="receipt-status-note">${escapeHtml(receipt.statusNote)}</div>
  <p class="receipt-note">${escapeHtml(t('Values on this receipt are limited to information returned by OG Exports. “Not provided” means that field was not available in the server record.'))}</p>
</main></body></html>`;
}

export async function saveTransactionReceipt(receipt: TransactionReceipt): Promise<void> {
  await saveHtmlAsPdf(transactionReceiptHtml(receipt), receipt.filename, receipt.title);
}
