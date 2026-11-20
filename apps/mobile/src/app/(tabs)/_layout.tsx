import {Tabs, Link} from 'expo-router';
import {MaterialIcons} from '@expo/vector-icons';
import {useMemo} from 'react';
import type {ComponentProps} from 'react';
import {View, useWindowDimensions} from 'react-native';
import {SafeAreaInsetsContext, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useColors} from '../../theme/use-colors';
import {ReaderPane} from '../../components/ReaderPane';
import {ReaderPaneProvider, useReaderPane} from '../../services/reader-pane';
import {resolveReaderLayout} from '../../lib/resolve-reader-layout';

export default function TabsLayout() {
  return (
    <ReaderPaneProvider>
      <ReaderShell />
    </ReaderPaneProvider>
  );
}

// Landscape: the tabs live in a column (centered, or pinned left beside the
// reader). The column never touches the right edge, and only touches the left
// edge in split mode, so it is handed insets that match where it actually sits.
// The tree shape is identical in every mode so rotating never remounts the tabs.
function ReaderShell() {
  const colors = useColors();
  const {width, height} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const {url, close} = useReaderPane();
  const layout = resolveReaderLayout({width, height, hasOpenLink: url !== null});
  const isCentered = layout.mode === 'centered';

  const columnInsets = useMemo(
    () =>
      layout.mode === 'stacked'
        ? insets
        : {...insets, left: isCentered ? 0 : insets.left, right: 0},
    [insets, layout.mode, isCentered],
  );

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        justifyContent: isCentered ? 'center' : 'flex-start',
        backgroundColor: colors.bg,
      }}
    >
      <View
        style={
          layout.mode === 'stacked'
            ? {flex: 1}
            : {
                width: layout.listWidth,
                borderLeftWidth: isCentered ? 1 : 0,
                borderRightWidth: isCentered ? 1 : 0,
                borderColor: colors.border,
              }
        }
      >
        <SafeAreaInsetsContext.Provider value={columnInsets}>
          <TabsNavigator />
        </SafeAreaInsetsContext.Provider>
      </View>
      {layout.mode === 'split' && url ? <ReaderPane key={url} url={url} onClose={close} /> : null}
    </View>
  );
}

function TabsNavigator() {
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
