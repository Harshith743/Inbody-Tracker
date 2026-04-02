/**
 * App.tsx — Root of the InBody Tracker application.
 *
 * Responsibilities:
 *  1. Load Space Grotesk + Bebas Neue through expo-font (blocks render until ready).
 *  2. Bootstrap the SQLite database (runs CREATE TABLE IF NOT EXISTS + seed).
 *  3. Mount React Navigation with the dark NavTheme applied globally.
 */

import React, { useEffect, useState, Component } from "react";
import { StatusBar } from "expo-status-bar";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import { BebasNeue_400Regular } from "@expo-google-fonts/bebas-neue";
import { Ionicons } from "@expo/vector-icons";

import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

import { getDatabase } from "./db/queries";
import { Colors, FontFamily, FontSize, Spacing, NavTheme } from "./theme";

// ─── Error Boundary ───────────────────────────────────────────────────────────

interface ErrorBoundaryState { hasError: boolean; error: string | null }

class ErrorBoundary extends Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(e: unknown): ErrorBoundaryState {
    return { hasError: true, error: String(e) };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0F14', padding: 24, gap: 12 }}>
          <Text style={{ fontSize: 48 }}>⚠️</Text>
          <Text style={{ color: '#FF4444', fontSize: 20, fontWeight: '700', textAlign: 'center' }}>Something went wrong</Text>
          <Text style={{ color: '#6B7A99', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>{this.state.error}</Text>
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false, error: null })}
            style={{ marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#00E5FF', borderRadius: 8 }}
          >
            <Text style={{ color: '#0D0F14', fontWeight: '700' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

// ─── Screens ──────────────────────────────────────────────────────────────────

import DashboardScreen from "./app/index";
import ReportsScreen from "./app/reports";
import AddReportScreen from "./app/add-report";
import ReportDetailScreen from "./app/report/[id]";
import CompareScreen from "./app/compare";
import CalendarScreen from "./app/calendar";

// ─── Navigation Types ─────────────────────────────────────────────────────────

export type TabParamList = {
  Dashboard: undefined;
  Reports: undefined;
  Compare: undefined;
  Calendar: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  AddReport: { reportId?: string } | undefined;
  ReportDetail: { id: string };
};

// ─── Navigators ───────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

// Keep splash visible until fonts + DB are both ready
SplashScreen.preventAutoHideAsync().catch(() => {});

/** Maps route explicitly to Ionicons */
function getIconName(route: string): keyof typeof Ionicons.glyphMap {
  switch (route) {
    case "Dashboard":
      return "stats-chart";
    case "Reports":
      return "document-text";
    case "Compare":
      return "git-compare";
    case "Calendar":
      return "calendar";
    default:
      return "ellipse";
  }
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          const color = focused ? Colors.primary : Colors.textSecondary;
          return (
            <View style={{ alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
              {focused && (
                <View
                  style={{
                    position: "absolute",
                    top: -4,
                    width: 30,
                    height: 3,
                    backgroundColor: Colors.primary,
                    borderRadius: 2,
                    shadowColor: Colors.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.5,
                    shadowRadius: 4,
                  }}
                />
              )}
              <Ionicons name={getIconName(route.name)} size={24} color={color} />
            </View>
          );
        },
        tabBarLabel: route.name,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: "#161B24", // Colors.surface override
          borderTopColor: "#1E2533", // Distinct top boundary override
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 8,
          paddingTop: 4,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontFamily: FontFamily.bodyMedium,
          fontSize: FontSize.xs,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Compare" component={CompareScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
    </Tab.Navigator>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  // ── 1. Load fonts ──────────────────────────────────────────────────────────
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    BebasNeue_400Regular,
  });

  // ── 2. Bootstrap DB ────────────────────────────────────────────────────────
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    getDatabase()
      .then(() => setDbReady(true))
      .catch((e: unknown) => setDbError(String(e)));
  }, []);

  // ── 3. Hide splash once both are ready ────────────────────────────────────
  useEffect(() => {
    if ((fontsLoaded || fontError) && dbReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, dbReady]);

  // ── Loading / error states ─────────────────────────────────────────────────
  if (dbError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Database Error</Text>
        <Text style={styles.errorBody}>{dbError}</Text>
      </View>
    );
  }

  if (!fontsLoaded && !fontError) {
    // Still loading — splash screen is held; render nothing visible.
    return null;
  }

  if (!dbReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.loadingText}>Loading database…</Text>
      </View>
    );
  }

  // ── Main app ───────────────────────────────────────────────────────────────
  return (
    <ErrorBoundary>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <NavigationContainer theme={NavTheme}>
          <StatusBar style="light" backgroundColor={Colors.background} />

          <Stack.Navigator
            screenOptions={{
              // Header colours
              headerStyle: { backgroundColor: Colors.surface },
              headerTintColor: Colors.textPrimary,
              headerTitleStyle: {
                fontFamily: FontFamily.bodySemi,
                fontSize: FontSize.lg,
                color: Colors.textPrimary,
              },
              headerShadowVisible: false,
              // Screen background
              contentStyle: { backgroundColor: Colors.background },
            }}
          >
            <Stack.Screen
              name="MainTabs"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AddReport"
              component={AddReportScreen}
              options={{ title: "New Measurement", presentation: "modal" }}
            />
            <Stack.Screen
              name="ReportDetail"
              component={ReportDetailScreen}
              options={{ title: "Report Detail" }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  errorTitle: {
    fontSize: FontSize.xl,
    // FontFamily.body not safe here — fonts may not be loaded
    color: Colors.error,
    fontWeight: "700",
    textAlign: "center",
  },
  errorBody: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
});
