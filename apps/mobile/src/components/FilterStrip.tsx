import {View, Text, TouchableOpacity} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';

type FilterStripProps = {
  activeTags: string[];
  searchQuery?: string;
  onRemoveTag: (tagText: string) => void;
  onClearSearch?: () => void;
  onClearAll: () => void;
  colors: {
    bgSubtle: string;
    border: string;
    text: string;
    textMuted: string;
    textFaint: string;
    accent: string;
    tagActiveBg: string;
    tagActiveText: string;
  };
};

export function FilterStrip({
  activeTags,
  searchQuery,
  onRemoveTag,
  onClearSearch,
  onClearAll,
  colors,
}: FilterStripProps) {
  if (activeTags.length === 0 && !searchQuery) return null;

  return (
    <View
      style={{
        marginHorizontal: 12,
        marginTop: 8,
        marginBottom: 4,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.bgSubtle,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.6,
          color: colors.textFaint,
          textTransform: 'uppercase',
          marginRight: 2,
        }}
      >
        Filtering
      </Text>

      {searchQuery && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 3,
            backgroundColor: `${colors.accent}26`,
          }}
        >
          <Text style={{fontSize: 11, fontWeight: '500', color: colors.accent}}>
            “{searchQuery}”
          </Text>
          <TouchableOpacity onPress={onClearSearch} accessibilityLabel="Remove search filter">
            <MaterialIcons name="close" size={12} color={colors.accent} />
          </TouchableOpacity>
        </View>
      )}

      {activeTags.map((tag) => (
        <View
          key={tag}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 3,
            backgroundColor: colors.tagActiveBg,
          }}
        >
          <Text style={{fontSize: 11, fontWeight: '500', color: colors.tagActiveText}}>{tag}</Text>
          <TouchableOpacity
            onPress={() => onRemoveTag(tag)}
            accessibilityLabel={`Remove ${tag} filter`}
          >
            <MaterialIcons name="close" size={12} color={colors.tagActiveText} />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity onPress={onClearAll} style={{marginLeft: 'auto'}}>
        <Text
          style={{
            fontSize: 11,
            color: colors.textFaint,
            textDecorationLine: 'underline',
          }}
        >
          Clear all
        </Text>
      </TouchableOpacity>
    </View>
  );
}
