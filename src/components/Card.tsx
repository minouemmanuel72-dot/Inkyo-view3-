import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../lib/theme';

export function Card({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.line }]}>{children}</View>;
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  const t = useTheme();
  return (
    <View style={[styles.empty, { borderColor: t.line }]}>
      <Text style={[styles.emptyTitle, { color: t.ink }]}>{title}</Text>
      <Text style={[styles.emptyText, { color: t.muted }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  empty: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
