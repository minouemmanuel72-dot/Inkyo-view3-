import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Screen } from '../../src/components/Screen';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/lib/theme';
import { roleLabel } from '../../src/types';

function Stat({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: t.ink }]}>{value}</Text>
      <Text style={{ color: t.muted, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

export default function Compte() {
  const { user, demo, signOut } = useAuth();
  const t = useTheme();
  if (!user) return null;
  return (
    <Screen title="Mon compte">
      <View style={styles.identity}>
        <View style={[styles.avatar, { backgroundColor: t.accent }]}>
          <Text style={[styles.avatarText, { color: t.accentInk }]}>{user.username.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={[styles.name, { color: t.ink }]}>{user.username}</Text>
          <Text style={{ color: t.muted, fontWeight: '700' }}>{roleLabel(user.role)}</Text>
        </View>
      </View>

      <Card>
        <View style={styles.stats}>
          <Stat label="Coins" value={String(user.coins_balance)} />
          <Stat label="Régularité" value={user.consistency_score.toFixed(1)} />
          <Stat label="Avertissements" value={`${user.strikes_count}/3`} />
        </View>
      </Card>

      {demo ? (
        <Card>
          <Text style={{ color: t.ink, fontWeight: '700' }}>Mode démo</Text>
          <Text style={{ color: t.muted }}>
            Ton compte est enregistré sur ce téléphone seulement. Il passera sur le serveur quand Supabase sera configuré.
          </Text>
        </Card>
      ) : null}

      <Button title="Se déconnecter" onPress={() => signOut()} variant="ghost" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 28, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800' },
  stats: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 22, fontWeight: '800' },
});
