import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import WelcomeScreen  from './src/screens/WelcomeScreen';
import ProfileScreen  from './src/screens/ProfileScreen';
import HomeScreen     from './src/screens/HomeScreen';
import RecordScreen   from './src/screens/RecordScreen';
import AnalysisScreen from './src/screens/AnalysisScreen';
import ResultsScreen  from './src/screens/ResultsScreen';
import HistoryScreen  from './src/screens/HistoryScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor="#1a3326" />
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Welcome">
        <Stack.Screen name="Welcome"  component={WelcomeScreen} />
        <Stack.Screen name="Profile"  component={ProfileScreen} />
        <Stack.Screen name="Home"     component={HomeScreen} />
        <Stack.Screen name="Record"   component={RecordScreen} />
        <Stack.Screen name="Analysis" component={AnalysisScreen} />
        <Stack.Screen name="Results"  component={ResultsScreen} />
        <Stack.Screen name="History"  component={HistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
