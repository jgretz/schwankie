import type {ComponentProps} from 'react';
import {Tabs, Link} from 'expo-router';
import {MaterialIcons} from '@expo/vector-icons';
import {useColors} from '../../theme/use-colors';

export default function TabsLayout() {
  const colors = useColors();

  // RN 0.88 widens the navigator's `color` to ColorValue (number | null too),
  // which vector-icons rejects; the tints are ours, so pick them from `focused`.
  const tabIcon =
    (name: ComponentProps<typeof MaterialIcons>['name']) =>
    ({focused}: {focused: boolean}) => (
      <MaterialIcons name={name} size={24} color={focused ? colors.accent : colors.textMuted} />
    );

  const addButton = (href: string) => () => (
    <Link href={href} style={{marginRight: 16, padding: 8}}>
      <MaterialIcons name="add" size={24} color={colors.accent} />
    </Link>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
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
        name="daily"
        options={{
          title: 'Daily',
          tabBarIcon: tabIcon('today'),
        }}
      />
      <Tabs.Screen
        name="compendium"
        options={{
          title: 'Compendium',
          tabBarIcon: tabIcon('library-books'),
          headerRight: addButton('/add?status=saved'),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Queue',
          tabBarIcon: tabIcon('inbox'),
          headerRight: addButton('/add'),
        }}
      />
      <Tabs.Screen
        name="feeds"
        options={{
          title: 'RSS',
          tabBarIcon: tabIcon('rss-feed'),
        }}
      />
      <Tabs.Screen
        name="emails"
        options={{
          title: 'Emails',
          tabBarIcon: tabIcon('mail'),
        }}
      />
    </Tabs>
  );
}
