import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '../../theme/use-colors';

export default function TabsLayout() {
  const colors = useColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Queue',
          tabBarIcon: ({ color }) => <MaterialIcons name="inbox" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="feeds"
        options={{
          title: 'Feeds',
          tabBarIcon: ({ color }) => <MaterialIcons name="rss-feed" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="emails"
        options={{
          title: 'Emails',
          tabBarIcon: ({ color }) => <MaterialIcons name="mail" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <MaterialIcons name="settings" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
