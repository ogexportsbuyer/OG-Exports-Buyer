import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { inflateSync } from 'node:zlib';
import colors from '../constants/colors.ts';

function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map(value => {
    const channel = Number.parseInt(value, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test('mobile brand accents use the supplied splash reference teal', () => {
  assert.equal(colors.light.primary.toUpperCase(), '#0A3335');
  assert.equal(colors.light.tint, colors.light.primary);
  assert.equal(colors.light.allocationBalance, colors.light.primary);
});

test('brand buttons and body text remain readable in light and dark appearances', () => {
  for (const name of ['light', 'dark']) {
    const theme = colors[name];
    assert.equal(theme.buttonBackground, theme.splashEnd, `${name} buttons match the splash background exactly`);
    assert.ok(contrast(theme.buttonBackground, theme.buttonForeground) >= 4.5, `${name} button label contrast`);
    assert.ok(contrast(theme.primary, theme.primaryForeground) >= 4.5, `${name} button text contrast`);
    assert.ok(contrast(theme.background, theme.foreground) >= 4.5, `${name} body text contrast`);
    assert.notEqual(theme.primary, theme.destructive, `${name} errors retain a separate semantic color`);
    assert.notEqual(theme.primary, theme.statusPending, `${name} pending states retain a separate semantic color`);
  }
});

test('splash artwork colors stay consistent across appearance settings', () => {
  for (const key of ['splashStart', 'splashMid', 'splashEnd', 'splashText', 'splashMuted']) {
    assert.equal(colors.light[key], colors.dark[key], key);
  }
  assert.ok(contrast(colors.light.splashEnd, colors.light.splashText) >= 4.5);
});

test('native splash uses a bundled PNG and the matching runtime splash background', () => {
  const config = JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8')).expo;
  const plugin = config.plugins.find(value => Array.isArray(value) && value[0] === 'expo-splash-screen');
  assert.ok(plugin, 'native splash plugin is configured');
  assert.equal(plugin[1].backgroundColor, colors.light.splashEnd);
  assert.equal(plugin[1].image, './assets/images/splash-transparent.png');
  const image = readFileSync(new URL(`../${plugin[1].image.replace(/^\.\//, '')}`, import.meta.url));
  assert.deepEqual([...image.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
});

test('native launch splash keeps its teal background without showing a second logo', () => {
  const config = JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8')).expo;
  const plugin = config.plugins.find(value => Array.isArray(value) && value[0] === 'expo-splash-screen');
  const image = readFileSync(new URL(`../${plugin[1].image.replace(/^\.\//, '')}`, import.meta.url));
  const chunks = [];
  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  while (offset < image.length) {
    const length = image.readUInt32BE(offset);
    const type = image.toString('ascii', offset + 4, offset + 8);
    const data = image.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      colorType = data[9];
    } else if (type === 'IDAT') {
      chunks.push(data);
    }
    offset += length + 12;
  }
  const decoded = inflateSync(Buffer.concat(chunks));
  const rowBytes = width * 4;
  assert.equal(colorType, 6, 'the image uses RGBA transparency');
  assert.equal(width, 288);
  assert.equal(height, 288);
  for (let y = 0; y < height; y += 1) {
    const row = decoded.subarray(y * (rowBytes + 1), (y + 1) * (rowBytes + 1));
    assert.equal(row[0], 0, 'each image row uses the None filter');
    assert.ok(row.subarray(1).every(channel => channel === 0), 'all native splash pixels are transparent');
  }
});

test('the branded splash wordmark fits the available width on narrow devices', () => {
  const screen = readFileSync(new URL('../app/index.tsx', import.meta.url), 'utf8');
  assert.match(screen, /const textBlockWidth = Math\.min\(Math\.max\(width - 48, 0\), 400\)/);
  assert.match(screen, /const wordmarkFontSize = Math\.min\(26, Math\.max\(17, Math\.round\(textBlockWidth \/ 14\)\)\)/);
  assert.match(screen, /adjustsFontSizeToFit/);
  assert.match(screen, /minimumFontScale=\{0\.72\}/);
});

function pngDimensions(relativePath) {
  const data = readFileSync(new URL(`../${relativePath.replace(/^\.\//, '')}`, import.meta.url));
  assert.deepEqual([...data.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  return [data.readUInt32BE(16), data.readUInt32BE(20)];
}

test('buyer launcher uses the supplied OG icon with a correctly separated Android foreground', () => {
  const config = JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8')).expo;
  assert.equal(config.name, 'OG Buyer');
  assert.equal(config.icon, './assets/images/og-buyer-launcher-icon.png');
  assert.equal(config.ios.icon, config.icon);
  assert.equal(config.android.icon, config.icon);
  assert.deepEqual(pngDimensions(config.icon), [1024, 1024]);
  assert.equal(config.android.adaptiveIcon.foregroundImage, './assets/images/og-adaptive-foreground.png');
  assert.deepEqual(pngDimensions(config.android.adaptiveIcon.foregroundImage), [1024, 1024]);
  assert.equal(config.android.adaptiveIcon.backgroundColor, colors.light.splashEnd);
  assert.equal(config.android.adaptiveIcon.backgroundImage, './assets/images/og-icon-background.png');
  assert.deepEqual(pngDimensions(config.android.adaptiveIcon.backgroundImage), [1024, 1024]);
  const launcherSvg = readFileSync(new URL('../assets/images/og-buyer-launcher-icon.svg', import.meta.url), 'utf8');
  const adaptiveSvg = readFileSync(new URL('../assets/images/og-buyer-adaptive-foreground.svg', import.meta.url), 'utf8');
  assert.match(launcherSvg, /xlink:href="#ogmark"/);
  assert.match(launcherSvg, /xlink:href="#cart"/);
  assert.doesNotMatch(launcherSvg, /<text[^>]*>3<\/text>/);
  assert.match(adaptiveSvg, /xlink:href="#ogmark"/);
  assert.equal(config.web.favicon, './assets/images/og-favicon.png');
  assert.deepEqual(pngDimensions(config.web.favicon), [128, 128]);
  const splash = config.plugins.find(plugin => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen')?.[1];
  assert.equal(splash.image, './assets/images/splash-transparent.png');
});

test('approved OG vector is transparent and cropped to the official mark', () => {
  const source = readFileSync(new URL('../assets/images/og-official-mark.svg', import.meta.url), 'utf8');
  assert.match(source, /viewBox="100 230 820 570"/);
  assert.doesNotMatch(source, /<rect[^>]+fill=/);
  assert.match(source, /stroke="#0A3335"/);
  assert.match(source, /stroke="url\(#og-metal\)"/);
});

test('screen and PDF branding share the transparent approved SVG mark', () => {
  const component = readFileSync(new URL('../components/BrandMark.tsx', import.meta.url), 'utf8');
  const svgSource = readFileSync(new URL('./official-mark-svg.ts', import.meta.url), 'utf8');
  const buyerHeader = readFileSync(new URL('../components/BuyerHomeHeader.tsx', import.meta.url), 'utf8');
  const pdf = readFileSync(new URL('./pdf-export.ts', import.meta.url), 'utf8');
  const splash = readFileSync(new URL('../app/index.tsx', import.meta.url), 'utf8');
  const splashAsset = readFileSync(new URL('../assets/images/og-splash.svg', import.meta.url), 'utf8');
  assert.match(component, /SvgXml/);
  assert.ok(component.includes('officialMarkSvg(surface'));
  assert.equal(component.includes('og-official-mark.png'), false);
  assert.match(svgSource, /viewBox="100 230 820 570"/);
  assert.match(svgSource, /surface === 'dark'/);
  assert.match(buyerHeader, /<BrandMark width=\{46\}/);
  assert.match(buyerHeader, /<BrandMark width=\{37\} onBackground="dark"/);
  assert.match(buyerHeader, /\['Worldwide'\]\.map\(label => \{/, 'the buyer homepage top navigation keeps only Worldwide');
  assert.doesNotMatch(buyerHeader, /'For you'|'Products'/, 'For you and Products are removed from the homepage top navigation');
  assert.match(buyerHeader, /const brandSlides = \[/);
  assert.match(buyerHeader, /borderBottomColor: active \? colors\.navigationAccent : 'transparent'/, 'Worldwide uses the exact selected-navigation gold');
  assert.match(buyerHeader, /borderColor: colors\.navigationAccent/, 'the homepage search border uses the same navigation gold');
  assert.match(buyerHeader, /<Feather name="shopping-cart" size=\{20\} color=\{colors\.primary\} \/>/, 'the homepage cart icon uses the dark-green primary color');
  assert.match(buyerHeader, /backgroundColor: colors\.accentSurface/, 'cart and notification count badges use the same gold surface');
  assert.match(buyerHeader, /const isFocused = usePathname\(\)\.split\('\/'\)\.includes\('buyer-home'\)/, 'autoplay follows the active buyer-home route');
  assert.doesNotMatch(buyerHeader, /<Image\b/, 'brand banners do not use product imagery');
  assert.doesNotMatch(buyerHeader, /promoAction|slide\.action/, 'brand banners do not show a product-browse button');
  assert.doesNotMatch(
    buyerHeader,
    /Your guide to export products from Pakistan|buyer-home-catalogue-guide/,
    'the buyer homepage omits the export guide banner',
  );
  assert.match(buyerHeader, /}, 5000\);/, 'brand slides auto-advance every five seconds');
  assert.match(buyerHeader, /!isFocused \|\| !motionSettingsReady \|\| reduceMotion \|\| carouselInteracting/, 'autoplay waits for motion preferences and pauses when reduced motion is enabled or the user is swiping');
  assert.match(buyerHeader, /if \(!motionSettingsReady\) return;/, 'slide entrance waits until motion preferences are known');
  assert.match(buyerHeader, /if \(!hasResolvedMotion\.current\) \{\s*progress\.setValue\(0\)/, 'the active banner animates into place after motion settings load');
  assert.match(buyerHeader, /Animated\.spring\(progress/);
  assert.match(buyerHeader, /outputRange: \[0\.9, 1\.045\]/, 'the active slide expands horizontally while moving forward');
  assert.match(buyerHeader, /function getHeroCardWidth\(viewportWidth: number\) \{\s*return Math\.min\(viewportWidth \* 0\.74, 350\);/, 'brand banners use a balanced, responsive card width');
  assert.match(buyerHeader, /const heroCardWidth = getHeroCardWidth\(carouselViewportWidth\)/, 'the carousel uses the shared responsive width');
  assert.match(buyerHeader, /const measuredCardWidth = getHeroCardWidth\(width\)/, 'viewport remeasurement keeps carousel snapping aligned');
  assert.match(buyerHeader, /promoCard:\s*\{\s*height: 200,/, 'brand banners use the requested compact vertical height');
  assert.match(buyerHeader, /promoCopy:\s*\{[^}]*justifyContent: 'flex-start'/, 'banner copy starts below the logo row instead of expanding upward');
  assert.match(buyerHeader, /promoBody:\s*\{[^}]*marginTop: 6,/, 'banner copy keeps a clear gap from the logo row');
  assert.doesNotMatch(buyerHeader, /promoIndex|promoIndexPill|padStart\(2, '0'\)/, 'brand banner cards do not show slide numbers');
  for (const message of [
    'Connecting Markets. Delivering Excellence.',
    'Exceptional Quality. Uncompromising Standards.',
    'Powering Global Trade Through Reliable Supply.',
    'Quality Assured. Relationships Built on Trust.',
    'Beyond Business. Building Lasting Partnerships.',
    'SGS Reports. Quality You Can Verify.',
    'ISO 22000 & HACCP-Aligned Supply.',
    'Halal Documentation, Clearly Verified.',
    'Request product-specific inspection reports and quality documents for eligible shipments.',
    'Supplier certificates and scope are confirmed for each applicable product before order.',
    'Halal certificates are confirmed by product and supplier before you place an order.',
  ]) {
    assert.ok(buyerHeader.includes(message), `homepage banner copy includes ${message}`);
  }
  const bannerPalettes = [...buyerHeader.matchAll(/backgroundColors: \['(#[A-F0-9]{6})', '(#[A-F0-9]{6})'\] as const/gi)];
  assert.equal(bannerPalettes.length, 8, 'each brand banner defines its own premium palette');
  assert.equal(new Set(bannerPalettes.map(([, firstColor]) => firstColor.toUpperCase())).size, 8);
  assert.deepEqual(
    bannerPalettes.map(([, start, end]) => [start.toUpperCase(), end.toUpperCase()]),
    [
      ['#07363A', '#0F6260'],
      ['#0C4A35', '#1E8354'],
      ['#193F33', '#47735B'],
      ['#1D4033', '#4F7653'],
      ['#3B4025', '#6A7137'],
      ['#153C34', '#39725E'],
      ['#214438', '#567557'],
      ['#41472A', '#747D46'],
    ],
    'banner backgrounds stay within the branded teal and green palette',
  );
  assert.match(buyerHeader, /promoArtworkHighlight/);
  assert.match(buyerHeader, /promoIconDisc/);
  assert.match(splash, /<BrandMark width=\{markWidth\} onBackground="dark"/);
  assert.equal(splash.includes('og-splash-mark.png'), false);
  assert.match(splashAsset, /href="\.\/og-official-mark\.svg"/);
  assert.equal(splashAsset.includes('og-logo.png'), false);
  assert.ok(pdf.includes("import { officialPdfLogoDataUri } from './pdf-logo'"));
  assert.equal(pdf.includes('Asset.fromModule'), false);
  assert.equal(pdf.includes('.base64()'), false, 'PDF branding does not read the asset through a potentially relative native file URI');
  for (const route of ['(auth)/login', '(auth)/register', 'lock', 'onboarding', '(tabs)/index', 'index']) {
    const source = readFileSync(new URL(`../app/${route}.tsx`, import.meta.url), 'utf8');
    assert.match(source, /<(?:BrandMark|AuthBrandHeader)\b/, `${route} uses shared approved branding`);
    assert.equal(source.includes('og-logo.png'), false, `${route} does not use the former logo`);
  }
});

test('login and registration use the same brand sizing and approved logo component', () => {
  const header = readFileSync(new URL('../components/AuthBrandHeader.tsx', import.meta.url), 'utf8');
  assert.match(header, /<BrandMark width=\{120\}/);
  assert.match(header, /fontSize: 22, lineHeight: 28/);
  for (const route of ['login', 'register']) {
    const source = readFileSync(new URL(`../app/(auth)/${route}.tsx`, import.meta.url), 'utf8');
    assert.match(source, /<AuthBrandHeader\s*\/>/);
  }
});

test('buyer profile identity card uses the official mark and branded account hierarchy', () => {
  const profile = readFileSync(new URL('../app/(buyer-tabs)/buyer-profile.tsx', import.meta.url), 'utf8');
  assert.match(profile, /testID="buyer-profile-identity-card"/);
  assert.match(profile, /<BrandMark width=\{42\}/);
  assert.match(profile, /backgroundColor: colors\.balanceCardStart/);
  assert.match(profile, /backgroundColor: colors\.balanceCardEnd/);
  assert.match(profile, /surfaceGlow/);
  assert.match(profile, /<BrandMark width=\{42\} onBackground="dark"/);
  assert.match(profile, /BUYER ACCOUNT/);
  assert.match(profile, /ACCOUNT HOLDER/);
  assert.match(profile, /name="mail"/);
  assert.match(profile, /name="briefcase"/);
});
