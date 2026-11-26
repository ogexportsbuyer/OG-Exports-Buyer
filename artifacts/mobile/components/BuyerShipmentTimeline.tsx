import React from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Card } from '@/components/InvestorUI';
import { LocalizedText as Text } from '@/components/LocalizedText';
import { useColors } from '@/hooks/useColors';
import type { ShipmentTimelineStep, ShipmentUpdate } from '@/lib/buyer-shipment-data';

export function BuyerShipmentTimeline({ steps, updates = [] }: {
  steps: ShipmentTimelineStep[];
  updates?: ShipmentUpdate[];
}) {
  const colors = useColors();
  const currentStep = steps.find(item => item.active)
    || [...steps].reverse().find(item => item.done)
    || steps[0];

  return (
    <>
      <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800', marginBottom: 9 }}>Shipment timeline</Text>
      {currentStep ? (
        <Card style={{ padding: 14, marginBottom: 9, backgroundColor: colors.secondary }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card }}>
              <Feather name={currentStep.done ? 'check-circle' : 'activity'} size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 9, fontWeight: '700', letterSpacing: 0.7, textTransform: 'uppercase' }}>
                Latest logistics milestone
              </Text>
              <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '800', marginTop: 3 }}>{currentStep.step}</Text>
              {currentStep.date !== '—' ? (
                <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 3 }}>{currentStep.date}</Text>
              ) : null}
            </View>
          </View>
        </Card>
      ) : null}
      <Card style={{ padding: 14, marginBottom: 13 }}>
        {steps.map((item, index) => {
          const completeColor = item.done ? colors.statusSuccess : colors.primary;
          return (
            <View key={item.step} style={{ flexDirection: 'row', minHeight: 52, gap: 11 }}>
              <View style={{ width: 24, alignItems: 'center' }}>
                <View style={{
                  width: 23,
                  height: 23,
                  borderRadius: 12,
                  borderWidth: item.done || item.active ? 0 : 1,
                  borderColor: colors.border,
                  backgroundColor: item.done ? colors.statusSuccessBackground : item.active ? colors.primary : colors.card,
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1,
                }}>
                  <Feather
                    name={item.done ? 'check' : item.active ? 'clock' : 'circle'}
                    size={item.done || item.active ? 12 : 8}
                    color={item.done ? completeColor : item.active ? colors.primaryForeground : colors.mutedForeground}
                  />
                </View>
                {index < steps.length - 1 ? (
                  <View style={{ position: 'absolute', top: 23, bottom: -1, width: 1, backgroundColor: colors.border }} />
                ) : null}
              </View>
              <View style={{ flex: 1, paddingBottom: 12, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: item.active ? colors.primary : colors.foreground, fontSize: 11, fontWeight: item.active || item.done ? '800' : '600' }}>
                    {item.step}{item.active ? ' · Current' : ''}
                  </Text>
                  {item.description ? <Text style={{ color: colors.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: 3 }}>{item.description}</Text> : null}
                </View>
                <Text style={{ color: colors.mutedForeground, fontSize: 9, textAlign: 'right' }}>{item.date}</Text>
              </View>
            </View>
          );
        })}
      </Card>

      {updates.length ? (
        <>
          <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '800', marginBottom: 9 }}>Other shipment updates</Text>
          {updates.map(update => (
            <Card key={update.id} style={{ padding: 13, marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondary }}>
                  <Feather name="activity" size={14} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '800' }}>{update.title}</Text>
                  {update.description ? <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 16, marginTop: 4 }}>{update.description}</Text> : null}
                  <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 5 }}>{update.date}</Text>
                </View>
              </View>
            </Card>
          ))}
        </>
      ) : null}
    </>
  );
}
