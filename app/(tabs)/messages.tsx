import React from 'react';
import { EmptyState } from '../../src/components/Card';
import { Screen } from '../../src/components/Screen';

export default function Messages() {
  return (
    <Screen title="Messages" subtitle="Parle avec les artistes et tes clients.">
      <EmptyState
        title="Pas encore de conversation"
        text="La messagerie et les commandes privées avec séquestre arrivent en semaine 6."
      />
    </Screen>
  );
}
