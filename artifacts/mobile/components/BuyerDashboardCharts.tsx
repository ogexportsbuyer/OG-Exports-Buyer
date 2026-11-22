import React from 'react';
import { View } from 'react-native';
import { Card } from '@/components/InvestorUI';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useColors } from '@/hooks/useColors';
import { amount, first, list, money } from '@/lib/data';

export function BuyerSpendTrendCard({ points, currency, yearOverYear }: {
  points: unknown;
  currency: string;
  yearOverYear: string;
}) {
  const colors = useColors();
  const series = list(points).flatMap(point => {
    const value = amount(point, ['value']);
    return value === null ? [] : [{ month: first(point, ['month'], '—'), value }];
  });
  const maximum = Math.max(0, ...series.map(point => point.value));
  const hasPurchases = series.some(point => point.value > 0);
  const total = series.reduce((sum, point) => sum + point.value, 0);

  return (
    <Card style={{ padding: 15, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800' }}>Monthly purchase value</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 4 }}>Last 12 months · {currency}</Text>
        </View>
        <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>{yearOverYear}</Text>
      </View>
      {hasPurchases ? (
        <>
          <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: '800', marginTop: 12 }}>
            {money(total, currency, { preserveSource: true })}
          </Text>
          <View accessibilityLabel="Monthly buyer purchase value over the last 12 months" style={{ height: 118, flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 11, paddingHorizontal: 2, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            {series.map((point, index) => {
              const height = maximum > 0 ? Math.max(5, point.value / maximum * 88) : 5;
              const isLatest = index === series.length - 1;
              return (
                <View key={`${point.month}-${index}`} style={{ flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <View style={{ width: '72%', height, minHeight: 5, borderTopLeftRadius: 5, borderTopRightRadius: 5, backgroundColor: isLatest ? colors.accent : colors.primary, opacity: point.value > 0 ? 1 : 0.25 }} />
                </View>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>{series[0]?.month}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>{series[series.length - 1]?.month}</Text>
          </View>
        </>
      ) : (
        <View style={{ minHeight: 116, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18, textAlign: 'center' }}>
            No purchases have been recorded in the last 12 months.
          </Text>
        </View>
      )}
    </Card>
  );
}

export function BuyerOrdersByStatusCard({ statuses }: { statuses: unknown }) {
  const colors = useColors();
  const rows = list(statuses).map((item, index) => ({
    name: first(item, ['name', 'status'], 'Order status'),
    value: amount(item, ['value', 'count']) ?? 0,
    suppliedColor: first(item, ['color']),
    index,
  }));
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const fallbackColors = [colors.primary, colors.accent, colors.tint, colors.mutedForeground, colors.lightGreen];
  const segments = rows.map(row => ({
    ...row,
    color: /^#[\da-f]{6}$/i.test(row.suppliedColor) ? row.suppliedColor : fallbackColors[row.index % fallbackColors.length],
  }));

  return (
    <Card style={{ padding: 15, marginBottom: 12 }}>
      <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '800' }}>Orders by status</Text>
      <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 4 }}>Current orders and pending RFQs</Text>
      <View style={{ height: 9, flexDirection: 'row', overflow: 'hidden', borderRadius: 8, backgroundColor: colors.secondary, marginTop: 14 }}>
        {segments.filter(segment => segment.value > 0).map(segment => (
          <View key={`${segment.name}-${segment.index}`} style={{ width: `${total > 0 ? segment.value / total * 100 : 0}%`, height: '100%', backgroundColor: segment.color }} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 5 }}>
        <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>Order records</Text>
        <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '800' }}>{total}</Text>
      </View>
      <View style={{ gap: 10, marginTop: 7 }}>
        {segments.map(row => {
          const ratio = total > 0 ? row.value / total : 0;
          return (
            <View key={`${row.name}-${row.index}`}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: row.color }} />
                <Text style={{ flex: 1, color: colors.mutedForeground, fontSize: 10 }}>{row.name}</Text>
                <Text style={{ color: colors.foreground, fontSize: 10, fontWeight: '800' }}>{row.value}</Text>
              </View>
              <View style={{ height: 4, borderRadius: 3, overflow: 'hidden', backgroundColor: colors.secondary }}>
                <View style={{ height: '100%', width: `${ratio * 100}%`, backgroundColor: row.color }} />
              </View>
            </View>
          );
        })}
        {!segments.length ? <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>Status details are not available.</Text> : null}
        {segments.length > 0 && total === 0 ? <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 2 }}>No orders or pending RFQs yet.</Text> : null}
      </View>
    </Card>
  );
}
