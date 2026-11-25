<footer class="pdf-footer">
  <table>
    <tr>
      <td>
        <strong>OG EXPORTS (PVT) LTD</strong><br>
        Global Trade · Secure Account Records
      </td>
      <td align="right">Generated {{ $generatedAt ?? '—' }}</td>
    </tr>
  </table>
  <div class="pdf-footnote">
    {{ $footerNote ?? 'This document reflects the information recorded in the OG Exports account when it was generated. It is not a substitute for bank or carrier confirmation.' }}
  </div>
</footer>
