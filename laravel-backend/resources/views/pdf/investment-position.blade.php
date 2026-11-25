<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Investment {{ $investmentReference }}</title>
  <style>
    @include('pdf.partials.brand-styles')
    .badge { display: inline-block; margin: 3px 3px 0 0; padding: 3px 7px; border: 1px solid #d4e0da; border-radius: 9px; background: #f2f6f3; color: #284c42; font-size: 7px; font-weight: bold; }
    .stages { width: 100%; margin-top: 4px; }
    .stages td { padding: 4px 7px; border-bottom: 1px solid #e4ece7; font-size: 8px; }
    .stage-done { color: #237557; }
    .stage-current { color: #0a3637; font-weight: bold; }
    .stage-pending { color: #8a9690; }
  </style>
</head>
<body>
  @include('pdf.partials.brand-header', [
    'documentKind' => 'Investment report',
    'documentTitle' => 'Investment Position',
    'documentReference' => $investmentReference ?: $projectReference,
    'generatedAt' => $generatedAt,
    'documentSubtitle' => $projectTitle.' · '.$projectStatusLabel,
  ])

  <table class="grid">
    <tr>
      <td width="60%">
        <div class="pdf-label">Project</div>
        <div class="value">{{ $projectTitle }}</div>
        <div style="margin-top:6px;">
          <span class="badge">{{ $tradeLabel }}</span>
          <span class="badge">{{ $projectStatusLabel }}</span>
          @if($investmentStatusLabel && $investmentStatusLabel !== $projectStatusLabel)
            <span class="badge">{{ $investmentStatusLabel }}</span>
          @endif
        </div>
      </td>
      <td width="40%">
        <div class="pdf-label">Account holder</div>
        <div class="value">{{ $user->name ?? '—' }}</div>
        <div class="muted">{{ $user->email ?? '' }}</div>
      </td>
    </tr>
    <tr>
      <td>
        <div class="pdf-label">Investment reference</div>
        <div class="value">{{ $investmentReference ?: '—' }}</div>
      </td>
      <td>
        <div class="pdf-label">Project reference</div>
        <div class="value">{{ $projectReference ?: '—' }}</div>
      </td>
    </tr>
  </table>

  <h2>Shipment Details</h2>
  <table class="grid">
    <tr>
      <td width="50%">
        <div class="pdf-label">Container</div>
        <div class="value">{{ $containerLabel }}</div>
        <div class="muted">{{ $commodity }}</div>
      </td>
      <td width="50%">
        <div class="pdf-label">Vessel / voyage</div>
        <div class="value">{{ $vessel }}</div>
        <div class="muted">{{ $shippingLine }}@if($voyage) · {{ $voyage }}@endif</div>
      </td>
    </tr>
    <tr>
      <td>
        <div class="pdf-label">Route · {{ $incoterm }}</div>
        <div class="value">{{ $portOfLoading }}</div>
        <div class="muted">↓</div>
        <div class="value">{{ $portOfDischarge }}</div>
      </td>
      <td>
        <div class="pdf-label">Commodity</div>
        <div class="value">{{ $commodity }}</div>
      </td>
    </tr>
  </table>

  <h2>Trade Progress</h2>
  <table class="grid">
    <tr>
      <td width="33%">
        <div class="pdf-label">Invested</div>
        <div class="value">{{ $investedAt }}</div>
      </td>
      <td width="33%">
        <div class="pdf-label">ETD</div>
        <div class="value">{{ $etd }}</div>
      </td>
      <td width="34%">
        <div class="pdf-label">ETA</div>
        <div class="value">{{ $eta }}</div>
      </td>
    </tr>
    <tr>
      <td colspan="3">
        <div class="pdf-label">Investment period</div>
        <div class="value">{{ $periodDays }} days</div>
      </td>
    </tr>
  </table>
  <table class="stages">
    @foreach($stages as $stage)
      <tr>
        <td class="{{ $stage['class'] }}">
          @if($stage['state'] === 'done')✓ @elseif($stage['state'] === 'current')● @else○ @endif
          {{ $stage['label'] }}
        </td>
      </tr>
    @endforeach
  </table>

  <h2>Investment Financials</h2>
  <table class="grid">
    <tr>
      <td width="50%">
        <div class="pdf-label">Invested</div>
        <div class="value">{{ $amountFormatted }}</div>
        @if($amountPkrFormatted)
          <div class="muted">{{ $amountPkrFormatted }}</div>
        @endif
      </td>
      <td width="50%">
        <div class="pdf-label">Expected / realized profit</div>
        <div class="value">+{{ $profitFormatted }}</div>
        @if($profitPkrFormatted)
          <div class="muted">+{{ $profitPkrFormatted }}</div>
        @endif
      </td>
    </tr>
    <tr>
      <td>
        <div class="pdf-label">ROI</div>
        <div class="value">{{ $roiFormatted }}%</div>
      </td>
      <td>
        <div class="pdf-label">Total return</div>
        <div class="value">{{ $totalReturnFormatted }}</div>
        @if($totalReturnPkrFormatted)
          <div class="muted">{{ $totalReturnPkrFormatted }}</div>
        @endif
      </td>
    </tr>
    @if($exchangeRateFormatted)
    <tr>
      <td colspan="2">
        <div class="pdf-label">Exchange rate</div>
        <div class="value">{{ $exchangeRateFormatted }}</div>
      </td>
    </tr>
    @endif
  </table>

  @include('pdf.partials.brand-footer', [
    'generatedAt' => $generatedAt,
    'footerNote' => 'Shipment stages and financial values reflect the information available in the account when this report was generated. Expected returns are estimates unless the server records them as realized.',
  ])
</body>
</html>
