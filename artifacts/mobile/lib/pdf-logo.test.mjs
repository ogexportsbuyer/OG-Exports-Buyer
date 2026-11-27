import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { brandedPdfHtml } from './pdf-html.ts';
import { officialMarkSvg } from './official-mark-svg.ts';
import { officialPdfLogoDataUri } from './pdf-logo.ts';

test('receipt PDFs embed the official OG logo as a self-contained vector', () => {
  assert.match(officialPdfLogoDataUri, /^data:image\/svg\+xml;charset=utf-8,/);
  const svg = decodeURIComponent(officialPdfLogoDataUri.split(',').slice(1).join(','));
  assert.match(svg, /viewBox="100 230 820 570"/);
  assert.match(svg, /stroke="url\(#og-pdf-metal\)"/);
  assert.match(svg, /stroke="#F0B43D"/);
  assert.doesNotMatch(svg, /#8A672A/i);
  assert.match(svg, /stroke="#0A3335"/);
  assert.doesNotMatch(svg, /<rect[^>]+fill=/);

  const html = brandedPdfHtml('<body>Receipt details</body>', 'Receipt', officialPdfLogoDataUri);
  assert.ok(html.includes(`<img src="${officialPdfLogoDataUri}" alt="OG Exports logo">`));
  assert.ok(html.includes('Receipt details'));

  const exporter = readFileSync(new URL('./pdf-export.ts', import.meta.url), 'utf8');
  assert.match(exporter, /officialPdfLogoDataUri/);
  assert.doesNotMatch(exporter, /Asset\.fromModule|absolutePdfAssetUri/);
});

test('transparent mark chooses a contrasting outline for light and dark surfaces', () => {
  const palette = { primary: '#0A3335', splashMuted: '#B9CCC9', accent: '#8A672A' };
  const lightSvg = officialMarkSvg('light', palette, 'light-test');
  const darkSvg = officialMarkSvg('dark', palette, 'dark-test');

  assert.match(lightSvg, /stroke="#0A3335"/);
  assert.match(darkSvg, /stroke="#B9CCC9"/);
  assert.match(darkSvg, /url\(#dark-test-metal\)/);
  assert.doesNotMatch(lightSvg, /<rect[^>]+fill=/);
  assert.doesNotMatch(darkSvg, /<rect[^>]+fill=/);
});
