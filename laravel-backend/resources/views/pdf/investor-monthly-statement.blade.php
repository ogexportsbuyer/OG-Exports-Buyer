<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Investor statement — {{ $statement['month_label'] }}</title>
    <style>
        @include('pdf.partials.brand-styles')
        .balance { font-weight: bold; background: #f1f6f2; }
        .section { margin: 18px 0 8px; color: #0a3637; font-size: 10px; font-weight: bold; letter-spacing: .65px; text-transform: uppercase; }
        .statement-table th { padding: 7px; border-bottom: 2px solid #F0B43D; background: #eaf2ee; color: #284c42; font-size: 7px; text-align: left; }
        .statement-table td { padding: 7px; border-bottom: 1px solid #dce7e2; color: #183b36; font-size: 8px; vertical-align: top; }
        .amount { text-align: right; white-space: nowrap; }
        .summary-table td { padding: 8px 9px; border: 1px solid #dce7e2; }
    </style>
</head>
<body>
    @include('pdf.partials.brand-header', [
        'documentKind' => 'Monthly account statement',
        'documentTitle' => 'Investor Wallet Statement',
        'documentReference' => $statement['month'],
        'generatedAt' => \Illuminate\Support\Carbon::parse($statement['generated_at'])->format('M j, Y g:i A'),
        'documentSubtitle' => $statement['month_label'].' · '.$investor->name.' · '.$statement['currency'],
    ])

    <div class="section">Monthly balance summary</div>
    <table class="summary-table">
        <tbody>
            <tr class="balance"><td>Opening balance</td><td class="amount">{{ $statement['currency'] }} {{ number_format($statement['opening_balance'], 2) }}</td></tr>
            <tr><td>Deposits</td><td class="amount">{{ $statement['currency'] }} {{ number_format($statement['deposits'], 2) }}</td></tr>
            <tr><td>Investments</td><td class="amount">− {{ $statement['currency'] }} {{ number_format($statement['investments'], 2) }}</td></tr>
            <tr><td>Principal returned</td><td class="amount">{{ $statement['currency'] }} {{ number_format($statement['principal_returns'], 2) }}</td></tr>
            <tr><td>Distributions (profit only)</td><td class="amount">{{ $statement['currency'] }} {{ number_format($statement['distributions'], 2) }}</td></tr>
            <tr><td>Withdrawals</td><td class="amount">− {{ $statement['currency'] }} {{ number_format($statement['withdrawals'], 2) }}</td></tr>
            @if ($statement['other_movements'] != 0)
                <tr><td>Other wallet movements (net)</td><td class="amount">{{ $statement['currency'] }} {{ number_format($statement['other_movements'], 2) }}</td></tr>
            @endif
            <tr class="balance"><td>Closing balance</td><td class="amount">{{ $statement['currency'] }} {{ number_format($statement['closing_balance'], 2) }}</td></tr>
        </tbody>
    </table>

    <div class="section">Posted wallet transactions</div>
    <table class="statement-table">
        <thead>
            <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Reference</th>
                <th>Status</th>
                <th class="amount">Debit</th>
                <th class="amount">Credit</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($statement['transactions'] as $transaction)
                <tr>
                    <td>{{ \Illuminate\Support\Carbon::parse($transaction['date_time'])->format('M j, Y g:i A') }}</td>
                    <td>
                        {{ \Illuminate\Support\Str::headline($transaction['type']) }}
                        @if ($transaction['principal_return'] !== null && $transaction['distribution_amount'] !== null)
                            <br><span class="muted">Principal {{ $statement['currency'] }} {{ number_format($transaction['principal_return'], 2) }} + profit {{ $statement['currency'] }} {{ number_format($transaction['distribution_amount'], 2) }}</span>
                        @endif
                        @if (($transaction['withdrawal_breakdown'] ?? null) !== null)
                            @php($withdrawalBreakdown = $transaction['withdrawal_breakdown'])
                            @php($withdrawalCurrency = $withdrawalBreakdown['currency'] ?? $statement['currency'])
                            <br><span class="muted">
                                Payout:
                                @if ($withdrawalBreakdown['payout_amount'] !== null)
                                    {{ $withdrawalCurrency }} {{ number_format($withdrawalBreakdown['payout_amount'], 2) }}
                                    @if ($withdrawalCurrency !== 'USD' && $withdrawalBreakdown['payout_amount_usd'] !== null)
                                        (USD {{ number_format($withdrawalBreakdown['payout_amount_usd'], 2) }})
                                    @endif
                                @else
                                    Not recorded
                                @endif
                                <br>Fee:
                                @if ($withdrawalBreakdown['fee'] !== null)
                                    {{ $withdrawalCurrency }} {{ number_format($withdrawalBreakdown['fee'], 2) }}
                                    @if ($withdrawalCurrency !== 'USD' && $withdrawalBreakdown['fee_usd'] !== null)
                                        (USD {{ number_format($withdrawalBreakdown['fee_usd'], 2) }})
                                    @endif
                                @else
                                    Not recorded
                                    @if ($withdrawalCurrency !== 'USD' && $withdrawalBreakdown['fee_usd'] !== null)
                                        (USD {{ number_format($withdrawalBreakdown['fee_usd'], 2) }})
                                    @endif
                                @endif
                                <br>Total wallet debit:
                                @if ($withdrawalBreakdown['total_debit'] !== null)
                                    {{ $withdrawalCurrency }} {{ number_format($withdrawalBreakdown['total_debit'], 2) }}
                                    @if ($withdrawalCurrency !== 'USD' && $withdrawalBreakdown['total_debit_usd'] !== null)
                                        (USD {{ number_format($withdrawalBreakdown['total_debit_usd'], 2) }})
                                    @endif
                                @else
                                    Not recorded
                                @endif
                            </span>
                        @endif
                    </td>
                    <td>{{ $transaction['reference'] ?: 'Not provided' }}</td>
                    <td>{{ \Illuminate\Support\Str::headline($transaction['status']) }}</td>
                    <td class="amount">{{ $transaction['direction'] === 'debit' ? $statement['currency'].' '.number_format($transaction['amount'], 2) : '' }}</td>
                    <td class="amount">{{ $transaction['direction'] === 'credit' ? $statement['currency'].' '.number_format($transaction['amount'], 2) : '' }}</td>
                </tr>
            @empty
                <tr><td colspan="6" class="muted">No posted wallet transactions for this month.</td></tr>
            @endforelse
        </tbody>
    </table>
    @include('pdf.partials.brand-footer', [
        'generatedAt' => \Illuminate\Support\Carbon::parse($statement['generated_at'])->format('M j, Y g:i A'),
        'footerNote' => 'This statement is generated from OG Exports wallet transaction records. Balances include available and reserved pending wallet funds; pending requests are not included in posted monthly totals.',
    ])
</body>
</html>