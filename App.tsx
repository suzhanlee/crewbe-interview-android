import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './src/constants';
import { RootStackParamList, MainTabParamList } from './src/types/navigation';
import { ScheduleProvider } from './src/contexts/ScheduleContext';
import { UserProvider } from './src/contexts/UserContext';
import { InterviewProvider } from './src/contexts/InterviewContext';

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
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Schedule') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'MockInterview') {
            iconName = focused ? 'mic' : 'mic-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.lightGray,
        },
      })}>
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: '홈',
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Schedule" 
        component={ScheduleScreen}
        options={{
          title: '일정 관리',
        }}
      />
      <Tab.Screen 
        name="MockInterview" 
        component={MockInterviewScreen}
        options={{
          title: '모의 면접',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: '프로필',
        }}
      />
    </Tab.Navigator>
  );
};

function App(): React.ReactElement {
  return (
    <UserProvider>
      <ScheduleProvider>
        <InterviewProvider>
          <StatusBar style="dark" backgroundColor={COLORS.white} />
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
        </InterviewProvider>
      </ScheduleProvider>
    </UserProvider>
  );
}

export default App; 