import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import HomeScreen from './src/screens/Home';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <HomeScreen />
    </SafeAreaView>
  );
} 