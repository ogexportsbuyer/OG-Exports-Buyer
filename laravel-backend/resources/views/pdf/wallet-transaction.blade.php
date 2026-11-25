<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Wallet Transaction {{ $transaction->reference ?? $transaction->id }}</title>
  <style>
    @include('pdf.partials.brand-styles')
  </style>
</head>
<body>
  @php
    $transactionLabel = ucwords(str_replace('_', ' ', (string) $transaction->type));
  @endphp
  @include('pdf.partials.brand-header', [
    'documentKind' => 'Wallet record',
    'documentTitle' => 'Wallet Transaction',
    'documentReference' => $transaction->reference ?: ('TXN-'.$transaction->id),
    'generatedAt' => $generatedAt,
    'documentSubtitle' => $transactionLabel.' · '.ucfirst((string) $transaction->direction),
  ])

  <table class="pdf-card">
    <tr>
      <td width="62%">
        <div class="pdf-card-title">{{ $withdrawalBreakdown ? 'Ledger amount' : 'Recorded amount' }}</div>
        <div class="pdf-card-value">{{ number_format((float) $transaction->amount, 2) }} {{ $transaction->wallet->currency ?? '' }}</div>
      </td>
      <td>
        <div class="pdf-card-title">Transaction status</div>
        <span class="pdf-status">{{ ucfirst((string) $transaction->status) }}</span>
      </td>
    </tr>
  </table>

  <table class="grid">
    <tr>
      <td width="50%">
        <div class="pdf-label">Transaction ID</div>
        <div class="value">{{ $transaction->id }}</div>
      </td>
      <td width="50%">
        <div class="pdf-label">Reference</div>
        <div class="value">{{ $transaction->reference ?: ('TXN-'.$transaction->id) }}</div>
      </td>
    </tr>
    <tr>
      <td>
        <div class="pdf-label">Account holder</div>
        <div class="value">{{ $user->name ?? '—' }}</div>
        <div class="muted">{{ $user->email ?? '' }}</div>
      </td>
      <td>
        <div class="pdf-label">Posted date</div>
        <div class="value">{{ optional($transaction->created_at)->format('d M Y H:i') ?? '—' }}</div>
      </td>
    </tr>
    <tr>
      <td>
        <div class="pdf-label">Type</div>
        <div class="value">{{ $transactionLabel }}</div>
      </td>
      <td>
        <div class="pdf-label">Direction</div>
        <div class="value">{{ ucfirst((string) $transaction->direction) }}</div>
      </td>
    </tr>
    <tr>
      <td>
        <div class="pdf-label">{{ $withdrawalBreakdown ? 'Ledger amount' : 'Amount' }}</div>
        <div class="value">{{ number_format((float) $transaction->amount, 2) }} {{ $transaction->wallet->currency ?? '' }}</div>
      </td>
      <td>
        <div class="pdf-label">Status</div>
        <div class="value">{{ ucfirst((string) $transaction->status) }}</div>
      </td>
    </tr>
    @if($withdrawalBreakdown)
      @include('pdf.partials.withdrawal-breakdown', ['withdrawalBreakdown' => $withdrawalBreakdown])
    @endif
    @php $meta = is_array($transaction->meta) ? $transaction->meta : []; @endphp
    @if(!empty($meta['original_currency']) || !empty($meta['original_amount']))
    <tr>
      <td colspan="2">
        <div class="pdf-label">Original amount</div>
        <div class="value">
          {{ $meta['original_currency'] ?? '' }}
          {{ isset($meta['original_amount']) ? number_format((float) $meta['original_amount'], 2) : '—' }}
        </div>
      </td>
    </tr>
    @endif
    @if(!empty($meta['note']) || !empty($meta['remark']))
    <tr>
      <td colspan="2">
        <div class="pdf-label">Note</div>
        <div class="value">{{ $meta['note'] ?? $meta['remark'] ?? '' }}</div>
      </td>
    </tr>
    @endif
  </table>

  @include('pdf.partials.brand-footer', [
    'generatedAt' => $generatedAt,
    'footerNote' => 'This receipt records the wallet transaction and status stored by OG Exports. It does not by itself confirm settlement with an external bank or payment provider.',
  ])
</body>
</html>
