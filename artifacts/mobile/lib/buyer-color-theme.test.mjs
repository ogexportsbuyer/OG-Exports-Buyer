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

test('buyer foreground accents use muted gold while original backgrounds remain unchanged', () => {
  assert.equal(palette.light.accent, '#B08D57');
  assert.equal(palette.dark.accent, '#B08D57');
  assert.equal(palette.light.stageFunding, '#B08D57');
  assert.equal(palette.dark.stageFunding, '#B08D57');
  assert.equal(palette.light.allocationProfits, '#B08D57');
  assert.equal(palette.dark.allocationProfits, '#B08D57');
  assert.equal(palette.light.glassTintGold, 'rgba(247, 235, 210, 0.72)');
  assert.equal(palette.dark.glassTintGold, 'rgba(56, 52, 42, 0.42)');
  assert.equal(palette.light.canvasWashGold, 'rgba(214, 184, 124, 0.28)');
  assert.equal(palette.dark.canvasWashGold, 'rgba(208, 180, 122, 0.12)');
  assert.equal(palette.light.statusPendingBackground, '#F3EFE4');
  assert.equal(palette.dark.statusPendingBackground, '#38342A');
});

test('gold accent labels maintain readable contrast in both appearances', () => {
  for (const appearance of ['light', 'dark']) {
    assert.ok(
      contrastRatio(palette[appearance].accentForeground, palette[appearance].accent) >= 4.5,
      `${appearance} gold accent should meet WCAG AA for normal text`,
    );
  }
});
