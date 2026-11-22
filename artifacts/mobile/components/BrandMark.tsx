import React, { useId } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { OFFICIAL_MARK_ASPECT, officialMarkSvg, type OfficialMarkSurface } from '@/lib/official-mark-svg';

type BackgroundTone = OfficialMarkSurface | 'auto';

function isDarkColor(value: string) {
  const match = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(value);
  if (!match) return false;
  const hex = match[1].length === 3
    ? match[1].split('').map(channel => channel + channel).join('')
    : match[1];
  const channels = [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16) / 255);
  const linear = channels.map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722 < 0.35;
}

/** Transparent vector mark; auto chooses the contrasting outline for the app theme. */
export function BrandMark({ width = 136, style, onBackground = 'auto' }: {
  width?: number;
  style?: StyleProp<ViewStyle>;
  onBackground?: BackgroundTone;
}) {
  const colors = useColors();
  const generatedId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const surface = onBackground === 'auto'
    ? (isDarkColor(colors.background) ? 'dark' : 'light')
    : onBackground;

  return (
    <SvgXml
      xml={officialMarkSvg(surface, colors, `og-mark-${generatedId}`)}
      width={width}
      height={width / OFFICIAL_MARK_ASPECT}
      accessibilityRole="image"
      accessibilityLabel="OG Exports official logo"
      style={style}
    />
  );
}
