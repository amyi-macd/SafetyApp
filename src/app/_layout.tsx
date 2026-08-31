import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="session"
          options={{
            headerShown: true,
            title: "Active Inspection",
            headerBackTitle: "Home",
            headerStyle: { backgroundColor: "#1F2A44" },
            headerTintColor: "#FFFFFF",
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
