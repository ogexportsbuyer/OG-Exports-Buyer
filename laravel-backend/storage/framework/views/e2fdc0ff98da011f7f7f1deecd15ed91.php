<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order <?php echo e($order->order_number ?? $order->id); ?></title>
  <style>
    <?php echo $__env->make('pdf.partials.brand-styles', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
  </style>
</head>
<body>
  <?php echo $__env->make('pdf.partials.brand-header', [
    'documentKind' => 'Buyer order summary',
    'documentTitle' => 'Order Confirmation',
    'documentReference' => $order->order_number ?? ('ORD-'.$order->id),
    'generatedAt' => $generatedAt,
    'documentSubtitle' => ucwords(str_replace('_', ' ', (string) $order->status)).' · '.($order->destination ?: ($order->quotation->destination ?? 'Destination not provided')),
  ], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>

  <table class="grid">
    <tr>
      <td width="50%">
        <div class="pdf-label">Order number</div>
        <div class="value"><?php echo e($order->order_number ?? ('ORD-'.$order->id)); ?></div>
      </td>
      <td width="50%">
        <div class="pdf-label">Order status</div>
        <div class="value"><span class="pdf-status"><?php echo e(ucwords(str_replace('_', ' ', (string) $order->status))); ?></span></div>
      </td>
    </tr>
    <tr>
      <td>
        <div class="pdf-label">Buyer</div>
        <div class="value"><?php echo e($order->buyer->name ?? '—'); ?></div>
        <div class="muted"><?php echo e($order->buyer->email ?? ''); ?></div>
      </td>
      <td>
        <div class="pdf-label">Order date</div>
        <div class="value"><?php echo e(optional($order->placed_at ?? $order->created_at)->format('d M Y') ?? '—'); ?></div>
      </td>
    </tr>
    <tr>
      <td>
        <div class="pdf-label">Destination</div>
        <div class="value"><?php echo e($order->destination ?: ($order->quotation->destination ?? '—')); ?></div>
      </td>
      <td>
        <div class="pdf-label">Destination port</div>
        <div class="value"><?php echo e($order->destination_port ?: ($order->port->name ?? '—')); ?></div>
      </td>
    </tr>
    <tr>
      <td>
        <div class="pdf-label">Delivery term</div>
        <div class="value"><?php echo e($order->incoterm ?: ($order->quotation->incoterm ?? '—')); ?></div>
      </td>
      <td>
        <div class="pdf-label">Payment terms</div>
        <div class="value"><?php echo e($order->quotation->payment_terms ?? ($order->payment_method ?: ($order->payment_status ?? '—'))); ?></div>
      </td>
    </tr>
    <?php if($order->required_delivery_date): ?>
    <tr>
      <td colspan="2">
        <div class="pdf-label">Required delivery date</div>
        <div class="value"><?php echo e(optional($order->required_delivery_date)->format('d M Y')); ?></div>
      </td>
    </tr>
    <?php endif; ?>
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
      <?php $__empty_1 = true; $__currentLoopData = $order->items; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $item): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
        <tr>
          <td><?php echo e($item->product_name ?? 'Product'); ?></td>
          <td><?php echo e($item->qty ?? $item->quantity ?? '—'); ?></td>
          <td>
            <?php if($item->unit_price !== null): ?>
              <?php echo e($order->currency ?? 'USD'); ?> <?php echo e(number_format((float) $item->unit_price, 2)); ?>

            <?php else: ?>
              —
            <?php endif; ?>
          </td>
          <td>
            <?php if($item->line_total !== null): ?>
              <?php echo e($order->currency ?? 'USD'); ?> <?php echo e(number_format((float) $item->line_total, 2)); ?>

            <?php elseif($item->unit_price !== null && is_numeric($item->qty ?? $item->quantity)): ?>
              <?php echo e($order->currency ?? 'USD'); ?> <?php echo e(number_format((float) $item->unit_price * (float) ($item->qty ?? $item->quantity), 2)); ?>

            <?php else: ?>
              —
            <?php endif; ?>
          </td>
        </tr>
      <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
        <tr>
          <td colspan="4">No line items</td>
        </tr>
      <?php endif; ?>
    </tbody>
  </table>

  <div class="total">
    Total:
    <strong><?php echo e($order->currency ?? 'USD'); ?> <?php echo e(number_format((float) ($order->total_value ?? 0), 2)); ?></strong>
  </div>

  <?php if($order->notes): ?>
    <p style="margin-top: 20px;"><span class="pdf-label">Notes</span><br><?php echo e($order->notes); ?></p>
  <?php endif; ?>

  <?php echo $__env->make('pdf.partials.brand-footer', [
    'generatedAt' => $generatedAt,
    'footerNote' => 'This is an order summary generated from the buyer account. It is not an invoice, proof of payment, or confirmation that funds have been received.',
  ], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
</body>
</html>
<?php /**PATH /home/runner/workspace/laravel-backend/resources/views/pdf/order.blade.php ENDPATH**/ ?>