@page {
  size: A4 portrait;
  margin: 20mm 15mm 19mm;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #ffffff;
  color: #183b36;
  font-family: DejaVu Sans, sans-serif;
  font-size: 10px;
  line-height: 1.5;
}

.pdf-watermark {
  position: fixed;
  top: 31%;
  left: 50%;
  z-index: -1;
  width: 250px;
  margin-left: -125px;
  opacity: .045;
}

.pdf-watermark img {
  display: block;
  width: 100%;
  height: auto;
}

h1 {
  margin: 3px 0 5px;
  color: #0a3637;
  font-size: 19px;
  line-height: 1.25;
}

h2 {
  margin: 19px 0 8px;
  padding: 0 0 5px;
  border-bottom: 1px solid #dce7e2;
  color: #0a3637;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .65px;
  text-transform: uppercase;
}

p {
  margin: 7px 0;
}

table {
  width: 100%;
  border-collapse: collapse;
}

tr,
.pdf-card,
.pdf-section {
  page-break-inside: avoid;
}

.pdf-brand-lockup {
  margin: 0 0 17px;
  padding: 8px 0 12px;
  border-top: 3px solid #F0B43D;
  border-bottom: 2px solid #0a3637;
}

.pdf-brand-lockup td {
  vertical-align: middle;
}

.pdf-logo-cell {
  width: 68px;
  padding-right: 10px;
}

.pdf-logo {
  display: block;
  width: 52px;
  height: 36px;
  object-fit: contain;
}

.pdf-brand-name {
  color: #0a3637;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: .1px;
}

.pdf-brand-subtitle,
.pdf-generation-label,
.pdf-kicker {
  color: #F0B43D;
  font-size: 7px;
  font-weight: 700;
  letter-spacing: 1.15px;
  text-transform: uppercase;
}

.pdf-generation {
  color: #51655f;
  font-size: 8px;
  text-align: right;
}

.pdf-generation-label {
  margin-bottom: 3px;
}

.pdf-document-head {
  margin: 0 0 18px;
}

.pdf-document-meta {
  margin-top: 5px;
  color: #61736d;
  font-size: 8px;
}

.pdf-reference {
  display: inline-block;
  margin-top: 5px;
  padding: 4px 8px;
  border: 1px solid #d6e3dc;
  border-radius: 10px;
  background: #f3f7f4;
  color: #173e38;
  font-size: 8px;
  font-weight: 700;
}

.pdf-card {
  margin: 9px 0 14px;
  padding: 11px 12px;
  border: 1px solid #d9e5df;
  border-left: 3px solid #F0B43D;
  border-radius: 7px;
  background: #f5f8f5;
}

.pdf-card-title {
  margin-bottom: 3px;
  color: #6a7a73;
  font-size: 7px;
  font-weight: 700;
  letter-spacing: .8px;
  text-transform: uppercase;
}

.pdf-card-value {
  color: #0a3637;
  font-size: 15px;
  font-weight: 700;
}

.pdf-label,
.label {
  color: #64766f;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: .55px;
  text-transform: uppercase;
}

.pdf-value,
.value {
  color: #183b36;
  font-size: 10px;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.muted,
.pdf-muted {
  color: #65766f;
  font-size: 8px;
}

.pdf-status {
  display: inline-block;
  padding: 4px 8px;
  border: 1px solid #c9dcd2;
  border-radius: 10px;
  background: #eaf2ee;
  color: #0a5147;
  font-size: 8px;
  font-weight: 700;
}

.grid,
.summary {
  width: 100%;
  margin: 0 0 12px;
}

.grid td,
.summary td {
  padding: 8px 9px 8px 0;
  border-bottom: 1px solid #e4ece7;
  vertical-align: top;
}

table.items,
table.data {
  width: 100%;
  margin-top: 7px;
  border-collapse: collapse;
}

table.items th,
table.data th {
  padding: 8px 7px;
  background: #0a3637;
  color: #ffffff;
  font-size: 7px;
  font-weight: 700;
  letter-spacing: .45px;
  text-align: left;
  text-transform: uppercase;
}

table.items td,
table.data td {
  padding: 7px;
  border-bottom: 1px solid #e2eae5;
  color: #183b36;
  font-size: 8px;
  text-align: left;
  vertical-align: top;
  overflow-wrap: anywhere;
}

.amount,
.total {
  text-align: right;
  white-space: nowrap;
}

.total {
  margin-top: 13px;
  color: #50635d;
  font-size: 10px;
}

.total strong {
  color: #0a3637;
  font-size: 15px;
}

.footer,
.pdf-footer {
  margin-top: 23px;
  padding-top: 9px;
  border-top: 1px solid #d8e3dd;
  color: #687a73;
  font-size: 7px;
}

.pdf-footer strong {
  color: #0a3637;
  font-size: 7px;
  letter-spacing: .5px;
}

.pdf-footer table td {
  padding: 0;
  vertical-align: top;
}

.pdf-footnote {
  margin-top: 7px;
  color: #77867f;
  font-size: 7px;
  line-height: 1.45;
}
<?php /**PATH /home/runner/workspace/laravel-backend/resources/views/pdf/partials/brand-styles.blade.php ENDPATH**/ ?>