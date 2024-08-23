import { Stack } from "expo-router";
import React from "react";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen
        options={{ contentStyle: { backgroundColor: "#F46001", } }}
        name="index"
      />
    </Stack>
  );
}
