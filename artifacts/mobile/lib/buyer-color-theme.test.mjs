import assert from 'node:assert/strict';
import test from 'node:test';
import palette from '../constants/colors.ts';

function relativeLuminance(hex) {
  const channels = hex.match(/^#([0-9a-f]{6})$/i)?.[1].match(/../g);
  assert.ok(channels, `Expected a six-digit hex color: ${hex}`);
  const [red, green, blue] = channels.map((channel) => {
    const value = parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground, background) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
    / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
}

test('mobile accent and card surfaces use the new premium gold palette', () => {
  assert.equal(palette.light.accent, '#F0B43D');
  assert.equal(palette.dark.accent, '#F0B43D');
  assert.equal(palette.light.navigationAccent, '#F0B43D');
  assert.equal(palette.dark.navigationAccent, '#F0B43D');
  assert.equal(palette.light.accentSurface, '#F0B43D');
  assert.equal(palette.dark.accentSurface, '#F0B43D');
  assert.equal(palette.light.stageFunding, palette.light.navigationAccent);
  assert.equal(palette.dark.stageFunding, palette.dark.accent);
  assert.equal(palette.light.allocationProfits, palette.light.navigationAccent);
  assert.equal(palette.dark.allocationProfits, palette.dark.accent);
  assert.equal(palette.light.glassFill, 'rgba(255, 249, 234, 0.74)');
  assert.equal(palette.light.glassTintGold, 'rgba(249, 224, 173, 0.78)');
  assert.equal(palette.dark.glassTintGold, 'rgba(104, 78, 32, 0.30)');
  assert.equal(palette.light.canvasWashGold, 'rgba(231, 181, 75, 0.22)');
  assert.equal(palette.dark.canvasWashGold, 'rgba(220, 174, 83, 0.10)');
  assert.equal(palette.light.statusPendingBackground, '#F3EFE4');
  assert.equal(palette.dark.statusPendingBackground, '#38342A');
});

test('gold accent labels maintain readable contrast in both appearances', () => {
  assert.ok(contrastRatio(palette.light.accentText, palette.light.background) >= 4.5, 'light accent text remains readable on the app surface');
  assert.ok(contrastRatio(palette.light.accentText, '#F7E0AD') >= 4.5, 'light accent text remains readable on warm card surfaces');
  assert.ok(contrastRatio(palette.dark.accentText, palette.dark.background) >= 4.5, 'dark accent text remains readable on the app surface');
  assert.equal(palette.light.navigationAccent, palette.light.accentSurface, 'light navigation uses the exact new gold');
  assert.equal(palette.dark.navigationAccent, palette.dark.accentSurface, 'dark navigation uses the exact new gold');
  assert.ok(contrastRatio(palette.light.accentForeground, palette.light.accentSurface) >= 4.5, 'light gold fills keep dark readable labels');
  assert.ok(contrastRatio(palette.dark.accentForeground, palette.dark.accentSurface) >= 4.5, 'dark gold fills keep dark readable labels');
});
