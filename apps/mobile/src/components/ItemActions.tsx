import { View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

type ItemActionsProps = {
  url: string;
  onMarkRead: () => void;
  onPromote: () => void;
  isMarkingRead?: boolean;
  isPromoting?: boolean;
  colors: {
    text: string;
    accent: string;
    textMuted: string;
  };
};

export function ItemActions({
  url,
  onMarkRead,
  onPromote,
  isMarkingRead,
  isPromoting,
  colors,
}: ItemActionsProps) {
  const handleOpen = async () => {
    await WebBrowser.openBrowserAsync(url);
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        justifyContent: 'flex-end',
      }}
    >
      <TouchableOpacity
        onPress={handleOpen}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 8,
          paddingVertical: 6,
        }}
      >
        <MaterialIcons name="open-in-new" size={16} color={colors.accent} />
        <Text style={{ fontSize: 12, color: colors.accent }}>Open</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onMarkRead}
        disabled={isMarkingRead}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 8,
          paddingVertical: 6,
          opacity: isMarkingRead ? 0.5 : 1,
        }}
      >
        {isMarkingRead ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <MaterialIcons name="done" size={16} color={colors.accent} />
        )}
        <Text style={{ fontSize: 12, color: colors.accent }}>Read</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onPromote}
        disabled={isPromoting}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 8,
          paddingVertical: 6,
          opacity: isPromoting ? 0.5 : 1,
        }}
      >
        {isPromoting ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <MaterialIcons name="arrow-upward" size={16} color={colors.accent} />
        )}
        <Text style={{ fontSize: 12, color: colors.accent }}>Promote</Text>
      </TouchableOpacity>
    </View>
  );
}
