import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Keyboard } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useColors } from '../theme/use-colors';
import { useCreateLink } from '../services/links';

export default function AddLinkScreen() {
  const colors = useColors();
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState('');
  const [title, setTitle] = useState('');

  const { mutate: createLink, isPending } = useCreateLink();

  const handleCreate = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a URL');
      return;
    }

    try {
      const urlObj = new URL(url);

      const tagArray = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      createLink(
        {
          url: urlObj.toString(),
          title: title.trim() || urlObj.hostname || url,
          tags: tagArray,
          status: 'queued',
        },
        {
          onSuccess: () => {
            Keyboard.dismiss();
            setUrl('');
            setTags('');
            setTitle('');
            Alert.alert('Success', 'Link added to queue', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          },
          onError: (error) => {
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create link');
          },
        },
      );
    } catch {
      Alert.alert('Error', 'Invalid URL');
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 16, gap: 16 }}>
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 }}>URL *</Text>
          <TextInput
            placeholder="https://example.com"
            placeholderTextColor={colors.textMuted}
            value={url}
            onChangeText={setUrl}
            editable={!isPending}
            autoCapitalize="none"
            keyboardType="url"
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              backgroundColor: colors.card,
              color: colors.text,
              fontSize: 14,
            }}
          />
        </View>

        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 }}>Title</Text>
          <TextInput
            placeholder="Optional title"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            editable={!isPending}
            multiline
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              backgroundColor: colors.card,
              color: colors.text,
              fontSize: 14,
              minHeight: 50,
            }}
          />
        </View>

        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 }}>Tags</Text>
          <TextInput
            placeholder="Comma-separated tags"
            placeholderTextColor={colors.textMuted}
            value={tags}
            onChangeText={setTags}
            editable={!isPending}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              backgroundColor: colors.card,
              color: colors.text,
              fontSize: 14,
            }}
          />
        </View>

        <TouchableOpacity
          onPress={handleCreate}
          disabled={isPending || !url.trim()}
          style={{
            backgroundColor: url.trim() && !isPending ? colors.accent : colors.textMuted,
            borderRadius: 8,
            paddingVertical: 12,
            alignItems: 'center',
            opacity: isPending || !url.trim() ? 0.5 : 1,
          }}
        >
          {isPending ? (
            <ActivityIndicator color={colors.accentForeground} />
          ) : (
            <Text style={{ color: colors.accentForeground, fontSize: 16, fontWeight: '600' }}>Add Link</Text>
          )}
        </TouchableOpacity>

        <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center' }}>
          * Required fields
        </Text>
      </View>
    </ScrollView>
  );
}
