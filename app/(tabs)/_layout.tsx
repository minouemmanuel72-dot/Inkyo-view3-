import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useTheme } from '../../src/lib/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function icon(name: IconName) {
  return ({ color, size }: { color: string; size: number }) => <Ionicons name={name} size={size} color={color} />;
}

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.muted,
        tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.line },
        tabBarLabelStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Pour toi', tabBarIcon: icon('albums-outline') }} />
      <Tabs.Screen name="commandes" options={{ title: 'Commandes', tabBarIcon: icon('briefcase-outline') }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages', tabBarIcon: icon('chatbubble-outline') }} />
      <Tabs.Screen name="compte" options={{ title: 'Mon compte', tabBarIcon: icon('person-outline') }} />
    </Tabs>
  );
}
