import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as ShareExtensionModule from 'expo-share-extension';
import { useEffect, useState } from 'react';
import { createLink } from 'client';
import { ensureClientInit } from '../services/shared-config';

interface ShareExtensionProps {
  url?: string;
  text?: string;
}

const DOMAIN_REGEX = /https?:\/\/[^\s]+|(?:www\.|[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}[^\s]*/;

function extractUrlFromText(text: string | undefined): string | undefined {
  if (!text) return undefined;
  const match = text.match(DOMAIN_REGEX);
  return match ? match[0] : undefined;
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed.match(/^https?:\/\//)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function getTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname || 'Shared Link';
  } catch {
    return 'Shared Link';
  }
}

export default function ShareExtension(props: ShareExtensionProps) {
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let finalUrl = props.url;

    if (!finalUrl && props.text) {
      finalUrl = extractUrlFromText(props.text);
    }

    if (finalUrl) {
      setUrl(finalUrl);
    }
  }, [props.url, props.text]);

  if (Platform.OS !== 'ios') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Share extension is only available on iOS</Text>
      </View>
    );
  }

  async function handleSave() {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await ensureClientInit();
      const normalizedUrl = normalizeUrl(url);
      const title = getTitleFromUrl(normalizedUrl);

      await createLink({ url: normalizedUrl, title });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => {
        ShareExtensionModule.close();
      }, 300);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save link';
      setError(errorMessage);
      setLoading(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  function handleCancel() {
    ShareExtensionModule.close();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Save to Schwankie</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter URL"
        placeholderTextColor="#999"
        value={url}
        onChangeText={setUrl}
        editable={!loading}
        autoFocus
        selectTextOnFocus
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.saveButton, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.cancelButton, loading && styles.buttonDisabled]}
          onPress={handleCancel}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f3ed',
    padding: 16,
    justifyContent: 'flex-start',
    paddingTop: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1e1e1e',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    color: '#1e1e1e',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#5b6f8a',
  },
  cancelButton: {
    backgroundColor: '#ddd',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e1e1e',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
