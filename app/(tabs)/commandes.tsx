import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button } from '../../src/components/Button';
import { Card, EmptyState } from '../../src/components/Card';
import { Screen } from '../../src/components/Screen';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/lib/theme';

export default function Commandes() {
  const { user } = useAuth();
  const t = useTheme();
  return (
    <Screen title="Commandes" subtitle="Tes gains et les demandes de tes clients.">
      <Card>
        <Text style={[styles.label, { color: t.muted }]}>Solde</Text>
        <Text style={[styles.amount, { color: t.ink }]}>{user ? user.coins_balance : 0} Coins</Text>
        <Button title="Retirer (bientôt)" onPress={() => undefined} variant="ghost" disabled />
      </Card>
      <EmptyState
        title="Aucune commande pour l'instant"
        text="Les demandes de commande et le suivi des paiements arrivent en semaines 5 et 6."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  amount: { fontSize: 32, fontWeight: '800' },
});
