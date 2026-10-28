import { Alert, Platform } from 'react-native';

// Dans le navigateur, Alert.alert ne fait rien : on utilise les fenêtres du navigateur.
const web = globalThis as unknown as {
  confirm?: (message: string) => boolean;
  alert?: (message: string) => void;
};

export function confirmAction(title: string, message: string, confirmLabel: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(web.confirm ? web.confirm(`${title}\n\n${message}`) : true);
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

export function notify(title: string, message: string): void {
  if (Platform.OS === 'web') {
    if (web.alert) web.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}
