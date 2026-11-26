<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Deposit <?php echo e($deposit->reference ?? $deposit->id); ?></title>
  <style>
    <?php echo $__env->make('pdf.partials.brand-styles', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
  </style>
</head>
<body>
  <?php echo $__env->make('pdf.partials.brand-header', [
    'documentKind' => 'Transaction receipt',
    'documentTitle' => 'Deposit Receipt',
    'documentReference' => $deposit->reference ?: ('OGDEP-INV-'.str_pad((string) $deposit->id, 3, '0', STR_PAD_LEFT)),
    'generatedAt' => $generatedAt,
    'documentSubtitle' => 'Record of the deposit request saved in your OG Exports account.',
  ], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>

  <table class="pdf-card">
    <tr>
      <td width="62%">
        <div class="pdf-card-title">Recorded deposit amount</div>
        <div class="pdf-card-value"><?php echo e($deposit->currency ?? 'USD'); ?> <?php echo e(number_format((float) $deposit->amount, 2)); ?></div>
      </td>
      <td>
        <div class="pdf-card-title">Account status</div>
        <span class="pdf-status"><?php echo e($statusLabel); ?></span>
      </td>
    </tr>
  </table>

  <table class="grid">
    <tr>
      <td width="50%">
        <div class="pdf-label">Deposit reference</div>
        <div class="value"><?php echo e($deposit->reference ?: ('OGDEP-INV-'.str_pad((string) $deposit->id, 3, '0', STR_PAD_LEFT))); ?></div>
      </td>
      <td width="50%">
        <div class="pdf-label">Bank reference</div>
        <div class="value"><?php echo e($deposit->bank_reference ?: '—'); ?></div>
      </td>
    </tr>
    <tr>
      <td>
        <div class="pdf-label">Account holder</div>
        <div class="value"><?php echo e($user->name ?? '—'); ?></div>
        <div class="muted"><?php echo e($user->email ?? ''); ?></div>
      </td>
      <td>
        <div class="pdf-label">Submitted</div>
        <div class="value"><?php echo e(optional($deposit->created_at)->format('d M Y H:i') ?? '—'); ?></div>
      </td>
    </tr>
    <tr>
      <td>
        <div class="pdf-label">Payment method</div>
        <div class="value"><?php echo e(ucwords(str_replace('_', ' ', (string) $deposit->method))); ?></div>
      </td>
      <td>
        <?php if($deposit->converted_amount): ?>
        <div class="pdf-label">Converted amount</div>
        <div class="value"><?php echo e($deposit->wallet_currency ?? ''); ?> <?php echo e(number_format((float) $deposit->converted_amount, 2)); ?></div>
        <?php endif; ?>
      </td>
    </tr>
    <?php if($deposit->project): ?>
    <tr>
      <td colspan="2">
        <div class="pdf-label">Project</div>
        <div class="value"><?php echo e($deposit->project->title ?? $deposit->project->name ?? '—'); ?></div>
      </td>
    </tr>
    <?php endif; ?>
    <?php if($deposit->note): ?>
    <tr>
      <td colspan="2">
        <div class="pdf-label">Note</div>
        <div class="value"><?php echo e($deposit->note); ?></div>
      </td>
    </tr>
    <?php endif; ?>
  </table>

  <?php echo $__env->make('pdf.partials.brand-footer', [
    'generatedAt' => $generatedAt,
    'footerNote' => 'This receipt records the deposit details and status stored in your OG Exports account. Approval is not proof that a wallet credit has been completed.',
  ], array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?>
</body>
</html>
<?php /**PATH /home/runner/workspace/laravel-backend/resources/views/pdf/deposit-receipt.blade.php ENDPATH**/ ?>