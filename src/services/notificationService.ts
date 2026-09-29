// =============================================
// EVI - Push Notification Service
// Registers device, stores token, handles alerts
// =============================================

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';

// Configure notification handling (foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request permission + register for push notifications.
 * Call this after user signs in (typically from AuthContext or Dashboard).
 * Returns the Expo push token, or null if declined / on simulator.
 */
export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device.');
    return null;
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;

  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }

  if (status !== 'granted') {
    console.log('Push notification permission denied.');
    return null;
  }

  // Android channel setup
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563EB',
    });
    await Notifications.setNotificationChannelAsync('urgent', {
      name: 'Urgent Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#EF4444',
      sound: 'default',
    });
  }

  const token = (
    await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID || undefined,
    })
  ).data;

  // Save token to user profile
  try {
    await updateDoc(doc(db, 'users', userId), {
      pushTokens: arrayUnion(token),
      pushTokenUpdatedAt: new Date(),
    });
  } catch (e) {
    console.warn('Save push token failed:', e);
  }

  return token;
}

/**
 * Send a local notification (for testing or client-side reminders).
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  seconds: number = 5
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    } as any,
  });
}

/**
 * Cancel all pending local notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
