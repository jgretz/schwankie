import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {useMemo, useState} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';

type Tag = {id: number; text: string; count: number};

type TagsDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  tags: Tag[];
  selectedTags: string[];
  onToggle: (tagText: string) => void;
  onClear: () => void;
  colors: {
    bg: string;
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

const TOP_GAP = 8;

export function TagsDrawer({
  isOpen,
  onClose,
  tags,
  selectedTags,
  onToggle,
  onClear,
  colors,
}: TagsDrawerProps) {
  const [filter, setFilter] = useState('');

  const filteredTags = useMemo(() => {
    if (!filter) return tags;
    const needle = filter.toLowerCase();
    return tags.filter((t) => t.text.toLowerCase().includes(needle));
  }, [tags, filter]);

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{flex: 1}}>
        <Pressable
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
          }}
          onPress={onClose}
          accessibilityLabel="Close tags drawer"
        />

        <SafeAreaView
          edges={['top']}
          style={{flex: 1, justifyContent: 'flex-end', marginTop: TOP_GAP}}
          pointerEvents="box-none"
        >
          <View
            style={{
              backgroundColor: colors.bg,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              borderTopWidth: 1,
              borderLeftWidth: 1,
              borderRightWidth: 1,
              borderColor: colors.border,
              overflow: 'hidden',
              maxHeight: '100%',
              flexShrink: 1,
            }}
          >
            <View style={{alignItems: 'center', paddingTop: 8, paddingBottom: 4}}>
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.border,
                }}
              />
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={{fontSize: 14, fontWeight: '600', color: colors.text}}>Filters</Text>
              <TouchableOpacity onPress={onClose} style={{padding: 4}}>
                <MaterialIcons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <MaterialIcons name="search" size={14} color={colors.textFaint} />
              <TextInput
                value={filter}
                onChangeText={setFilter}
                placeholder="Search tags…"
                placeholderTextColor={colors.textFaint}
                autoCapitalize="none"
                autoCorrect={false}
                style={{
                  flex: 1,
                  fontSize: 12,
                  color: colors.text,
                  paddingVertical: 0,
                }}
              />
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '600',
                  letterSpacing: 1,
                  color: colors.textFaint,
                  textTransform: 'uppercase',
                }}
              >
                Tags — tap to filter
              </Text>
              {selectedTags.length > 0 && (
                <TouchableOpacity onPress={onClear}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.textFaint,
                      textDecorationLine: 'underline',
                    }}
                  >
                    Clear
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={{flexShrink: 1}} keyboardShouldPersistTaps="handled">
              {filteredTags.length === 0 ? (
                <Text
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 13,
                    color: colors.textFaint,
                  }}
                >
                  {tags.length === 0 ? 'No tags yet' : 'No matches'}
                </Text>
              ) : (
                filteredTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.text);
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      onPress={() => onToggle(tag.text)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        backgroundColor: isSelected ? colors.tagActiveBg : 'transparent',
                      }}
                    >
                      <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1}}>
                        <MaterialIcons
                          name={isSelected ? 'check-box' : 'check-box-outline-blank'}
                          size={16}
                          color={isSelected ? colors.tagActiveText : colors.textMuted}
                        />
                        <Text
                          style={{
                            fontSize: 13,
                            color: isSelected ? colors.tagActiveText : colors.textMuted,
                          }}
                          numberOfLines={1}
                        >
                          {tag.text}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 11,
                          color: isSelected ? colors.tagActiveText : colors.textFaint,
                          opacity: isSelected ? 0.75 : 1,
                        }}
                      >
                        {tag.count}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
              <SafeAreaView edges={['bottom']} />
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
