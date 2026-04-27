import {View, TouchableOpacity, Text, ActivityIndicator, Alert} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {openLink} from '../services/open-link';

type LinkActionsProps = {
  url: string;
  onPromote?: () => void;
  onDelete?: () => void;
  isPromoting?: boolean;
  isDeleting?: boolean;
  colors: {
    accent: string;
    bg: string;
    error: string;
    textMuted: string;
  };
};

export function LinkActions({
  url,
  onPromote,
  onDelete,
  isPromoting,
  isDeleting,
  colors,
}: LinkActionsProps) {
  const handleOpen = () => openLink({url, colors, source: 'LinkActions'});

  const handleDelete = () => {
    Alert.alert('Delete link?', 'This cannot be undone.', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: onDelete},
    ]);
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
        <Text style={{fontSize: 12, color: colors.accent}}>Open</Text>
      </TouchableOpacity>

      {onPromote && (
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
            <MaterialIcons name="bookmark-add" size={16} color={colors.accent} />
          )}
          <Text style={{fontSize: 12, color: colors.accent}}>Promote</Text>
        </TouchableOpacity>
      )}

      {onDelete && (
        <TouchableOpacity
          onPress={handleDelete}
          disabled={isDeleting}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 8,
            paddingVertical: 6,
            opacity: isDeleting ? 0.5 : 1,
          }}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <MaterialIcons name="delete-outline" size={16} color={colors.error} />
          )}
          <Text style={{fontSize: 12, color: colors.error}}>Delete</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
