<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order {{ $order->order_number ?? $order->id }}</title>
  <style>
    @include('pdf.partials.brand-styles')
  </style>
</head>
<body>
  @include('pdf.partials.brand-header', [
    'documentKind' => 'Buyer order summary',
    'documentTitle' => 'Order Confirmation',
    'documentReference' => $order->order_number ?? ('ORD-'.$order->id),
    'generatedAt' => $generatedAt,
    'documentSubtitle' => ucwords(str_replace('_', ' ', (string) $order->status)).' · '.($order->destination ?: ($order->quotation->destination ?? 'Destination not provided')),
  ])

  <table class="grid">
    <tr>
      <td width="50%">
        <div class="pdf-label">Order number</div>
        <div class="value">{{ $order->order_number ?? ('ORD-'.$order->id) }}</div>
      </td>
      <td width="50%">
        <div class="pdf-label">Order status</div>
        <div class="value"><span class="pdf-status">{{ ucwords(str_replace('_', ' ', (string) $order->status)) }}</span></div>
      </td>
    </tr>
    <tr>
      <td>
        <div class="pdf-label">Buyer</div>
        <div class="value">{{ $order->buyer->name ?? '—' }}</div>
        <div class="muted">{{ $order->buyer->email ?? '' }}</div>
      </td>
      <td>
        <div class="pdf-label">Order date</div>
        <div class="value">{{ optional($order->placed_at ?? $order->created_at)->format('d M Y') ?? '—' }}</div>
      </td>
    </tr>
    <tr>
      <td>
        <div class="pdf-label">Destination</div>
        <div class="value">{{ $order->destination ?: ($order->quotation->destination ?? '—') }}</div>
      </td>
      <td>
        <div class="pdf-label">Destination port</div>
        <div class="value">{{ $order->destination_port ?: ($order->port->name ?? '—') }}</div>
      </td>
    </tr>
    <tr>
      <td>
        <div class="pdf-label">Delivery term</div>
        <div class="value">{{ $order->incoterm ?: ($order->quotation->incoterm ?? '—') }}</div>
      </td>
      <td>
        <div class="pdf-label">Payment terms</div>
        <div class="value">{{ $order->quotation->payment_terms ?? ($order->payment_method ?: ($order->payment_status ?? '—')) }}</div>
      </td>
    </tr>
    @if($order->required_delivery_date)
    <tr>
      <td colspan="2">
        <div class="pdf-label">Required delivery date</div>
        <div class="value">{{ optional($order->required_delivery_date)->format('d M Y') }}</div>
      </td>
    </tr>
    @endif
  </table>

  <div class="pdf-label">Order items</div>
  <table class="items">
    <thead>
      <tr>
        <th>Product</th>
        <th>Qty (MT)</th>
        <th>Unit Price</th>
        <th>Line Total</th>
      </tr>
    </thead>
    <tbody>
      @forelse($order->items as $item)
        <tr>
          <td>{{ $item->product_name ?? 'Product' }}</td>
          <td>{{ $item->qty ?? $item->quantity ?? '—' }}</td>
          <td>
            @if($item->unit_price !== null)
              {{ $order->currency ?? 'USD' }} {{ number_format((float) $item->unit_price, 2) }}
            @else
              —
            @endif
          </td>
          <td>
            @if($item->line_total !== null)
              {{ $order->currency ?? 'USD' }} {{ number_format((float) $item->line_total, 2) }}
            @elseif($item->unit_price !== null && is_numeric($item->qty ?? $item->quantity))
              {{ $order->currency ?? 'USD' }} {{ number_format((float) $item->unit_price * (float) ($item->qty ?? $item->quantity), 2) }}
            @else
              —
            @endif
          </td>
        </tr>
      @empty
        <tr>
          <td colspan="4">No line items</td>
        </tr>
      @endforelse
    </tbody>
  </table>

  <div class="total">
    Total:
    <strong>{{ $order->currency ?? 'USD' }} {{ number_format((float) ($order->total_value ?? 0), 2) }}</strong>
  </div>

  @if($order->notes)
    <p style="margin-top: 20px;"><span class="pdf-label">Notes</span><br>{{ $order->notes }}</p>
  @endif

  @include('pdf.partials.brand-footer', [
    'generatedAt' => $generatedAt,
    'footerNote' => 'This is an order summary generated from the buyer account. It is not an invoice, proof of payment, or confirmation that funds have been received.',
  ])
</body>
</html>
