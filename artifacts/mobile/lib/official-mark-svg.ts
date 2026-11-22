export type OfficialMarkSurface = 'light' | 'dark';

export type OfficialMarkPalette = {
  primary: string;
  splashMuted: string;
  accent: string;
};

export const OFFICIAL_MARK_ASPECT = 820 / 570;

export function officialMarkSvg(
  surface: OfficialMarkSurface,
  palette: OfficialMarkPalette,
  idPrefix = 'og-mark',
) {
  const outline = surface === 'dark' ? palette.splashMuted : palette.primary;
  const outlineOpacity = surface === 'dark' ? '0.82' : '1';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="820" height="570" viewBox="100 230 820 570">
<defs>
  <linearGradient id="${idPrefix}-metal" gradientUnits="userSpaceOnUse" x1="0" y1="265" x2="0" y2="755">
    <stop offset="0" stop-color="#ffffff"/>
    <stop offset=".3" stop-color="#e4e4e8"/>
    <stop offset=".37" stop-color="#8e8f9a"/>
    <stop offset=".445" stop-color="#1f7a4a"/>
    <stop offset=".55" stop-color="#1b7a49"/>
    <stop offset=".62" stop-color="#9a9ba5"/>
    <stop offset=".75" stop-color="#d9dadf"/>
    <stop offset="1" stop-color="#f6f6f8"/>
  </linearGradient>
</defs>
<g fill="none" stroke="${outline}" stroke-opacity="${outlineOpacity}" stroke-linejoin="round">
  <path d="M785 360 A215 215 0 1 0 845 510" stroke-width="76" stroke-linecap="butt"/>
  <circle cx="785" cy="360" r="38" fill="${outline}" stroke="none"/>
  <path d="M731 483 H874 A245 245 0 0 1 872.5 545.5 H731 A31 31 0 0 1 731 483 Z" stroke-width="16" fill="${outline}"/>
</g>
<g fill="none">
  <path d="M785 360 A215 215 0 1 0 845 510" stroke="url(#${idPrefix}-metal)" stroke-width="60" stroke-linecap="butt"/>
  <circle cx="785" cy="360" r="30" fill="url(#${idPrefix}-metal)"/>
  <path d="M731 483 H874 A245 245 0 0 1 872.5 545.5 H731 A31 31 0 0 1 731 483 Z" fill="url(#${idPrefix}-metal)"/>
</g>
<circle cx="390" cy="510" r="215" fill="none" stroke="${outline}" stroke-opacity="${outlineOpacity}" stroke-width="76"/>
<circle cx="390" cy="510" r="215" fill="none" stroke="url(#${idPrefix}-metal)" stroke-width="60"/>
<path d="M510 372 A185 185 0 0 0 510 648" fill="none" stroke="${palette.accent}" stroke-width="5" stroke-linecap="round"/>
<g fill="none" stroke="#ffffff" stroke-opacity=".65" stroke-width="8" stroke-linecap="round">
  <path d="M202 442 A200 200 0 0 1 355 313"/>
  <path d="M445 442 A200 200 0 0 1 595 313"/>
</g>
</svg>`;
}
