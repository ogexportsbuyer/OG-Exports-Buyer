<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Deposit {{ $deposit->reference ?? $deposit->id }}</title>
  <style>
    @include('pdf.partials.brand-styles')
  </style>
</head>
<body>
  @include('pdf.partials.brand-header', [
    'documentKind' => 'Transaction receipt',
    'documentTitle' => 'Deposit Receipt',
    'documentReference' => $deposit->reference ?: ('OGDEP-INV-'.str_pad((string) $deposit->id, 3, '0', STR_PAD_LEFT)),
    'generatedAt' => $generatedAt,
    'documentSubtitle' => 'Record of the deposit request saved in your OG Exports account.',
  ])

  <table class="pdf-card">
    <tr>
      <td width="62%">
        <div class="pdf-card-title">Recorded deposit amount</div>
        <div class="pdf-card-value">{{ $deposit->currency ?? 'USD' }} {{ number_format((float) $deposit->amount, 2) }}</div>
      </td>
      <td>
        <div class="pdf-card-title">Account status</div>
        <span class="pdf-status">{{ $statusLabel }}</span>
      </td>
    </tr>
  </table>

  <table class="grid">
    <tr>
      <td width="50%">
        <div class="pdf-label">Deposit reference</div>
        <div class="value">{{ $deposit->reference ?: ('OGDEP-INV-'.str_pad((string) $deposit->id, 3, '0', STR_PAD_LEFT)) }}</div>
      </td>
      <td width="50%">
        <div class="pdf-label">Bank reference</div>
        <div class="value">{{ $deposit->bank_reference ?: '—' }}</div>
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
        <div class="value">{{ optional($deposit->created_at)->format('d M Y H:i') ?? '—' }}</div>
      </td>
    </tr>
    <tr>
      <td>
        <div class="pdf-label">Payment method</div>
        <div class="value">{{ ucwords(str_replace('_', ' ', (string) $deposit->method)) }}</div>
      </td>
      <td>
        @if($deposit->converted_amount)
        <div class="pdf-label">Converted amount</div>
        <div class="value">{{ $deposit->wallet_currency ?? '' }} {{ number_format((float) $deposit->converted_amount, 2) }}</div>
        @endif
      </td>
    </tr>
    @if($deposit->project)
    <tr>
      <td colspan="2">
        <div class="pdf-label">Project</div>
        <div class="value">{{ $deposit->project->title ?? $deposit->project->name ?? '—' }}</div>
      </td>
    </tr>
    @endif
    @if($deposit->note)
    <tr>
      <td colspan="2">
        <div class="pdf-label">Note</div>
        <div class="value">{{ $deposit->note }}</div>
      </td>
    </tr>
    @endif
  </table>

  @include('pdf.partials.brand-footer', [
    'generatedAt' => $generatedAt,
    'footerNote' => 'This receipt records the deposit details and status stored in your OG Exports account. Approval is not proof that a wallet credit has been completed.',
  ])
</body>
</html>
