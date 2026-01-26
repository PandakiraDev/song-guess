// Reanimated must be imported first to initialize native module
import 'react-native-reanimated';

import React, { useEffect } from 'react';
import { StatusBar, View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { colors } from './src/theme/colors';
import { RootStackParamList } from './src/types';
import { useUserStore } from './src/store/userStore';

// Screens
import {
  HomeScreen,
  AuthScreen,
  CreateRoomScreen,
  JoinRoomScreen,
  LobbyScreen,
  AddSongsScreen,
  GameScreen,
  ResultsScreen,
  ProfileScreen,
  QRScannerScreen,
} from './src/screens';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Custom dark theme for navigation
const DarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.neonPink,
    background: colors.background,
    card: colors.card,
    text: colors.textPrimary,
    border: colors.surface,
    notification: colors.neonPink,
  },
};

// Loading screen while checking auth
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.neonPink} />
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

export default function App() {
  const { isLoading, loadStoredUser } = useUserStore();

  useEffect(() => {
    loadStoredUser();

    // Hide navigation bar on Android for immersive experience
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('overlay-swipe');
      NavigationBar.setBackgroundColorAsync(colors.background);
    }
  }, []);

  if (isLoading) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
          <LoadingScreen />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <NavigationContainer theme={DarkTheme}>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            {/* Main Screens */}
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />

            {/* Room Screens */}
            <Stack.Screen name="CreateRoom" component={CreateRoomScreen} />
            <Stack.Screen name="JoinRoom" component={JoinRoomScreen} />
            <Stack.Screen name="QRScanner" component={QRScannerScreen} />
            <Stack.Screen name="Lobby" component={LobbyScreen} />

            {/* Game Screens */}
            <Stack.Screen name="AddSongs" component={AddSongsScreen} />
            <Stack.Screen
              name="Game"
              component={GameScreen}
              options={{
                gestureEnabled: false, // Prevent swipe back during game
              }}
            />
            <Stack.Screen
              name="Results"
              component={ResultsScreen}
              options={{
                gestureEnabled: false,
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    color: colors.textSecondary,
    fontSize: 16,
  },
});
