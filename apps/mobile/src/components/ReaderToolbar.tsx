import {TouchableOpacity, View} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import type {ComponentProps} from 'react';
import {useColors} from '../theme/use-colors';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

export type ReaderToolbarAction = {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

type ReaderToolbarProps = {
  actions: ReaderToolbarAction[];
  placement: 'rail' | 'bar';
};

// The split pane's stand-in for the Safari sheet's toolbar: the same actions
// the portrait browser offers. As a rail it stacks down the display's
// right-hand status strip; as a bar it runs along the bottom of the page.
export function ReaderToolbar({actions, placement}: ReaderToolbarProps) {
  const colors = useColors();
  const style =
    placement === 'rail'
      ? {flexDirection: 'column' as const, alignItems: 'center' as const, gap: 12}
      : {
          flexDirection: 'row' as const,
          justifyContent: 'space-around' as const,
          alignItems: 'center' as const,
          height: 44,
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        };

  return (
    <View style={style}>
      {actions.map(function (action) {
        return (
          <TouchableOpacity
            key={action.label}
            onPress={action.onPress}
            disabled={action.disabled}
            accessibilityLabel={action.label}
            style={{padding: 8, opacity: action.disabled ? 0.35 : 1}}
          >
            <MaterialIcons name={action.icon} size={22} color={colors.accent} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
