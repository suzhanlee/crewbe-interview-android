import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
<<<<<<< HEAD
import { Text } from 'react-native';

=======
import { StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './src/constants';
>>>>>>> 122eaf797253677b196dc157cff472f7f03d22cb
import { RootStackParamList, MainTabParamList } from './src/types/navigation';
import { ScheduleProvider } from './src/contexts/ScheduleContext';
import { UserProvider } from './src/contexts/UserContext';

// Import screens
import UserNameInputScreen from './src/screens/UserNameInput';
import HomeScreen from './src/screens/Home';
import ProfileScreen from './src/screens/Profile';
import ScheduleScreen from './src/screens/Schedule';
import MockInterviewScreen from './src/screens/MockInterview';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}>
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: '홈',
          tabBarIcon: () => <Text>🏠</Text>,
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Schedule" 
        component={ScheduleScreen}
        options={{
          title: '일정 관리',
          tabBarIcon: () => <Text>📅</Text>,
        }}
      />
      <Tab.Screen 
        name="MockInterview" 
        component={MockInterviewScreen}
        options={{
          title: '모의 면접',
          tabBarIcon: () => <Text>🎤</Text>,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: '프로필',
          tabBarIcon: () => <Text>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

function App(): React.ReactElement {
  return (
    <UserProvider>
      <ScheduleProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="UserNameInput">
            <Stack.Screen 
              name="UserNameInput" 
              component={UserNameInputScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="MainTabs" 
              component={MainTabs}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ScheduleProvider>
    </UserProvider>
  );
}

export default App; 