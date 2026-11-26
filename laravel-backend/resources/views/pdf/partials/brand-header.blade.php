@php($brandMarkDataUri = 'data:image/png;base64,'.base64_encode(file_get_contents(public_path('og-logo.png'))))

<div class="pdf-watermark" aria-hidden="true">
  <img src="{{ $brandMarkDataUri }}" alt="">
</div>

<table class="pdf-brand-lockup">
  <tr>
    <td class="pdf-logo-cell">
      <img class="pdf-logo" src="{{ $brandMarkDataUri }}" alt="OG Exports official logo">
    </td>
    <td>
      <div class="pdf-brand-name">OG Exports</div>
      <div class="pdf-brand-subtitle">Global Trade · Secure Account Record</div>
    </td>
    <td class="pdf-generation" width="150">
      <div class="pdf-generation-label">Generated</div>
      <div>{{ $generatedAt ?? '—' }}</div>
    </td>
  </tr>
</table>

<div class="pdf-document-head">
  <div class="pdf-kicker">{{ $documentKind ?? 'Account document' }}</div>
  <h1>{{ $documentTitle ?? 'OG Exports document' }}</h1>
  @if(!empty($documentReference))
    <div class="pdf-reference">Reference · {{ $documentReference }}</div>
  @endif
  @if(!empty($documentSubtitle))
    <div class="pdf-document-meta">{{ $documentSubtitle }}</div>
  @endif
</div>
