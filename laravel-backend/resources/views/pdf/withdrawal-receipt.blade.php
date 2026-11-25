<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Withdrawal {{ $withdrawal->reference ?? $withdrawal->id }}</title>
  <style>
    @include('pdf.partials.brand-styles')
  </style>
</head>
<body>
  @php
    $bank = is_array($withdrawal->bank_details) ? $withdrawal->bank_details : [];
    $bankName = $bank['bank_name'] ?? $bank['bank'] ?? '—';
    $accountHolder = $bank['account_holder'] ?? '—';
    $iban = $bank['iban'] ?? $bank['account_number'] ?? '—';
  @endphp

  @include('pdf.partials.brand-header', [
    'documentKind' => 'Transaction receipt',
    'documentTitle' => 'Withdrawal Receipt',
    'documentReference' => $withdrawal->reference ?: ('WDR-'.$withdrawal->id),
    'generatedAt' => $generatedAt,
    'documentSubtitle' => 'Record of the withdrawal request and payout details saved in your account.',
  ])

  <table class="pdf-card">
    <tr>
      <td width="62%">
        <div class="pdf-card-title">Requested bank payout</div>
        <div class="pdf-card-value">{{ $withdrawalBreakdown['currency'] ? $withdrawalBreakdown['currency'].' ' : '' }}{{ number_format((float) $withdrawalBreakdown['payout_amount'], 2) }}</div>
      </td>
      <td>
        <div class="pdf-card-title">Account status</div>
        <span class="pdf-status">{{ ucfirst((string) $withdrawal->status) }}</span>
      </td>
    </tr>
  </table>

  <table class="grid">
    <tr>
      <td width="50%">
        <div class="pdf-label">Withdrawal ID</div>
        <div class="value">{{ $withdrawal->id }}</div>
      </td>
      <td width="50%">
        <div class="pdf-label">Reference</div>
        <div class="value">{{ $withdrawal->reference ?: ('WDR-'.$withdrawal->id) }}</div>
      </td>
    </tr>
    <tr>
      <td>
        <div class="pdf-label">Account holder</div>
        <div class="value">{{ $user->name ?? '—' }}</div>
        <div class="muted">{{ $user->email ?? '' }}</div>
      </td>
      <td>
        <div class="pdf-label">Submitted</div>
        <div class="value">{{ optional($withdrawal->created_at)->format('d M Y H:i') ?? '—' }}</div>
      </td>
    </tr>
    <tr>
      <td>
        <div class="pdf-label">Requested bank payout</div>
        <div class="value">{{ $withdrawalBreakdown['currency'] ? $withdrawalBreakdown['currency'].' ' : '' }}{{ number_format((float) $withdrawalBreakdown['payout_amount'], 2) }}</div>
        @if($withdrawalBreakdown['currency'] !== 'USD' && $withdrawalBreakdown['payout_amount_usd'] !== null)
          <div class="muted">USD {{ number_format((float) $withdrawalBreakdown['payout_amount_usd'], 2) }}</div>
        @endif
      </td>
      <td>
        <div class="pdf-label">Payout status</div>
        <div class="value">{{ ucfirst((string) $withdrawal->status) }}</div>
      </td>
    </tr>
    @include('pdf.partials.withdrawal-breakdown', ['withdrawalBreakdown' => $withdrawalBreakdown, 'showPayout' => false])
    <tr>
      <td>
        <div class="pdf-label">Bank</div>
        <div class="value">{{ $bankName }}</div>
      </td>
      <td>
        <div class="pdf-label">Account holder</div>
        <div class="value">{{ $accountHolder }}</div>
      </td>
    </tr>
    <tr>
      <td colspan="2">
        <div class="pdf-label">Account / IBAN</div>
        <div class="value">{{ $iban }}</div>
      </td>
    </tr>
    @if($withdrawal->note)
    <tr>
      <td colspan="2">
        <div class="pdf-label">Note</div>
        <div class="value">{{ $withdrawal->note }}</div>
      </td>
    </tr>
    @endif
  </table>

  @include('pdf.partials.brand-footer', [
    'generatedAt' => $generatedAt,
    'footerNote' => 'This receipt records the withdrawal status reported by OG Exports. An approved or completed status does not independently verify receipt of funds by the external bank.',
  ])
</body>
</html>
