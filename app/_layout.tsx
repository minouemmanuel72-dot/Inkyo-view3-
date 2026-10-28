import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/lib/theme';

// Envoie l'utilisateur vers la connexion s'il n'est pas connecté,
// et vers l'application s'il l'est déjà.
function Gate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const t = useTheme();
  const inAuth = (segments as string[])[0] === '(auth)';

  useEffect(() => {
    if (loading) return;
    if (!user && !inAuth) {
      router.replace('/connexion');
    } else if (user && inAuth) {
      router.replace('/');
    }
  }, [user, loading, inAuth, router]);

  return (
    <View style={[styles.fill, { backgroundColor: t.bg }]}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg } }}>
        <Stack.Screen name="publier" options={{ presentation: 'modal' }} />
      </Stack>
      {loading ? (
        <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: t.bg }]}>
          <ActivityIndicator size="large" color={t.accent} />
        </View>
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <Gate />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
});
