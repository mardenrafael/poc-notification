import "expo-dev-client";
import { StatusBar } from "expo-status-bar";
import { Button, Platform, StyleSheet, Text, View } from "react-native";
import * as Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      alert("Não foi possivel pegar o token para notificação push");
      return null;
    }

    const expoToken = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.default.expoConfig?.extra?.eas.projectId,
    });
    token = expoToken.data;
    console.log(token);
  } else {
    alert("So é possivel em dispositivos fisicos");
  }

  return token;
}

async function scheduleNotificationAsync() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "hello world!",
      body: "hehehe boy",
      data: {
        id: "algum id",
        name: "nome qualquer",
      },
    },
    trigger: {
      seconds: 1,
    },
  });
}

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token == null) {
        console.error("Ops");
        return;
      }
      setExpoPushToken(token);
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener(notification => {
        // setNotification(notification);
        setNotification(true);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(response => {
        console.log(response);
      });

    return () => {
      if (notificationListener.current !== undefined) {
        Notifications.removeNotificationSubscription(
          notificationListener.current,
        );
      }

      if (responseListener.current !== undefined) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  });

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Button
        title="Notificar"
        onPress={async () => {
          await scheduleNotificationAsync();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
