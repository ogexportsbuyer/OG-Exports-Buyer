<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{{ $report_type_label }}</title>
  <style>
    @include('pdf.partials.brand-styles')
    .summary td { padding: 8px 9px; border: 1px solid #dce7e2; vertical-align: top; }
  </style>
</head>
<body>
  @include('pdf.partials.brand-header', [
    'documentKind' => 'Investment report',
    'documentTitle' => $report_type_label,
    'documentReference' => $start_date || $end_date ? (($start_date ?: '—').' — '.($end_date ?: '—')) : null,
    'generatedAt' => $generated_at,
    'documentSubtitle' => 'Prepared for '.($user->name ?? 'Investor'),
  ])

  <table class="summary">
    <tr>
      <td width="50%">
        <div class="pdf-label">Account holder</div>
        <div class="value">{{ $user->name ?? '—' }}</div>
        <div class="muted">{{ $user->email ?? '' }}</div>
      </td>
      <td width="50%">
        <div class="pdf-label">Investments</div>
        <div class="value">{{ $summary['investments_count'] }}</div>
      </td>
    </tr>
    <tr>
      <td>
        <div class="pdf-label">Total invested</div>
        <div class="value">{{ $summary['total_invested_label'] ?? number_format((float) $summary['total_invested'], 2) }}</div>
      </td>
      <td>
        <div class="pdf-label">Total profit earned</div>
        <div class="value">{{ $summary['total_profit_earned_label'] ?? number_format((float) $summary['total_profit_earned'], 2) }}</div>
      </td>
    </tr>
    <tr>
      <td>
        <div class="pdf-label">Lifetime ROI</div>
        <div class="value">{{ number_format((float) $summary['lifetime_roi'], 2) }}%</div>
      </td>
      <td></td>
    </tr>
  </table>

  <h2>Investments</h2>
  @if(count($investments) === 0)
    <p class="muted">No investments in this period.</p>
  @else
    <table class="data">
      <thead>
        <tr>
          <th>Reference</th>
          <th>Project</th>
          <th>Type</th>
          <th>Status</th>
          <th>Amount</th>
          <th>Profit</th>
          <th>ROI %</th>
          <th>Invested</th>
        </tr>
      </thead>
      <tbody>
        @foreach($investments as $row)
          <tr>
            <td>{{ $row['reference'] }}</td>
            <td>{{ $row['project'] }}</td>
            <td>{{ $row['type'] }}</td>
            <td>{{ $row['status'] }}</td>
            <td>{{ $row['amount_label'] ?? number_format((float) $row['amount'], 2) }}</td>
            <td>{{ $row['profit_label'] ?? number_format((float) $row['profit'], 2) }}</td>
            <td>{{ number_format((float) $row['roi'], 2) }}</td>
            <td>{{ $row['invested_at'] }}</td>
          </tr>
        @endforeach
      </tbody>
    </table>
  @endif

  <h2>Profit Distributions</h2>
  @if(count($distributions) === 0)
    <p class="muted">No profit distributions in this period.</p>
  @else
    <table class="data">
      <thead>
        <tr>
          <th>Project</th>
          <th>Invested</th>
          <th>Profit</th>
          <th>ROI %</th>
          <th>Distributed</th>
        </tr>
      </thead>
      <tbody>
        @foreach($distributions as $row)
          <tr>
            <td>{{ $row['project'] }}</td>
            <td>{{ $row['invested_amount_label'] ?? number_format((float) $row['invested_amount'], 2) }}</td>
            <td>{{ $row['profit_amount_label'] ?? number_format((float) $row['profit_amount'], 2) }}</td>
            <td>{{ number_format((float) $row['roi_pct'], 2) }}</td>
            <td>{{ $row['distributed_at'] }}</td>
          </tr>
        @endforeach
      </tbody>
    </table>
  @endif

  @if(count($wallet_profits) > 0)
    <h2>Wallet Profit Credits</h2>
    <table class="data">
      <thead>
        <tr>
          <th>Type</th>
          <th>Amount</th>
          <th>Reference</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        @foreach($wallet_profits as $row)
          <tr>
            <td>{{ $row['type'] }}</td>
            <td>{{ $row['amount_label'] ?? number_format((float) $row['amount'], 2) }}</td>
            <td>{{ $row['reference'] }}</td>
            <td>{{ $row['date'] }}</td>
          </tr>
        @endforeach
      </tbody>
    </table>
  @endif

  @include('pdf.partials.brand-footer', [
    'generatedAt' => $generated_at,
    'footerNote' => 'This report summarizes investment data recorded in the OG Exports account. It is not a bank statement or a guarantee of future returns.',
  ])
</body>
</html>
