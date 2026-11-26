<?php ($brandMarkDataUri = 'data:image/png;base64,'.base64_encode(file_get_contents(public_path('og-logo.png')))); ?>

<div class="pdf-watermark" aria-hidden="true">
  <img src="<?php echo e($brandMarkDataUri); ?>" alt="">
</div>

<table class="pdf-brand-lockup">
  <tr>
    <td class="pdf-logo-cell">
      <img class="pdf-logo" src="<?php echo e($brandMarkDataUri); ?>" alt="OG Exports official logo">
    </td>
    <td>
      <div class="pdf-brand-name">OG Exports</div>
      <div class="pdf-brand-subtitle">Global Trade · Secure Account Record</div>
    </td>
    <td class="pdf-generation" width="150">
      <div class="pdf-generation-label">Generated</div>
      <div><?php echo e($generatedAt ?? '—'); ?></div>
    </td>
  </tr>
</table>

<div class="pdf-document-head">
  <div class="pdf-kicker"><?php echo e($documentKind ?? 'Account document'); ?></div>
  <h1><?php echo e($documentTitle ?? 'OG Exports document'); ?></h1>
  <?php if(!empty($documentReference)): ?>
    <div class="pdf-reference">Reference · <?php echo e($documentReference); ?></div>
  <?php endif; ?>
  <?php if(!empty($documentSubtitle)): ?>
    <div class="pdf-document-meta"><?php echo e($documentSubtitle); ?></div>
  <?php endif; ?>
</div>
<?php /**PATH /home/runner/workspace/laravel-backend/resources/views/pdf/partials/brand-header.blade.php ENDPATH**/ ?>