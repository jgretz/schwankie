import {Link, Stack} from 'expo-router';
import {MaterialIcons} from '@expo/vector-icons';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useColors} from '../theme/use-colors';

type TabStackProps = {
  title: string;
  addHref?: string;
};

// Native tabs draw no header, so each tab hosts a one-screen stack for its
// title and actions. The safe-area edges are read natively per screen: on the
// closed Duo the tab bar becomes a rail in the right-hand strip, and only the
// screen's own view knows that inset.
export function TabStack({title, addHref}: TabStackProps) {
  const colors = useColors();

  return (
    <Stack
      screenLayout={({children}) => (
        <SafeAreaView edges={['right', 'bottom']} style={{flex: 1, backgroundColor: colors.bg}}>
          {children}
        </SafeAreaView>
      )}
      screenOptions={{
        title,
        headerStyle: {backgroundColor: colors.card},
        headerTintColor: colors.text,
        headerTitleStyle: {fontWeight: '600'},
        headerShadowVisible: true,
        headerRight: addHref
          ? () => (
              <Link href={addHref} style={{padding: 8}}>
                <MaterialIcons name="add" size={24} color={colors.accent} />
              </Link>
            )
          : undefined,
      }}
    />
  );
}
