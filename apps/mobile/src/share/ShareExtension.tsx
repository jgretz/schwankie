import {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {createLink} from 'client';
import {ensureClientInit} from '../services/shared-config';

const schwankieLogo = require('../../assets/icon.png');

// expo-share-extension is iOS-only and only present in the share extension bundle;
// lazy-require so the main app bundle doesn't crash when the native module is absent.
let closeShareExtension: () => void = () => {};
if (Platform.OS === 'ios') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  closeShareExtension = require('expo-share-extension').close;
}

interface ShareExtensionProps {
  url?: string;
  text?: string;
}

type Status = 'idle' | 'saving' | 'success' | 'error';

const URL_REGEX = /https?:\/\/[^\s]+/;

function extractUrl(url: string | undefined, text: string | undefined): string {
  if (url) return url.trim();
  if (!text) return '';
  const match = text.match(URL_REGEX);
  return match ? match[0].trim() : text.trim();
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isValidUrl(url: string): boolean {
  return /^https?:\/\/[^\s.]+\.[^\s]+/.test(url);
}

function titleFromUrl(url: string): string {
  try {
    return new URL(url).hostname || 'Shared Link';
  } catch {
    return 'Shared Link';
  }
}

export default function ShareExtension(props: ShareExtensionProps) {
  const [url, setUrl] = useState(() => extractUrl(props.url, props.text));
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const next = extractUrl(props.url, props.text);
    if (next) setUrl(next);
  }, [props.url, props.text]);

  if (Platform.OS !== 'ios') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Share extension is only available on iOS</Text>
      </View>
    );
  }

  async function handleSave() {
    if (status === 'saving') return;

    const trimmed = url.trim();
    if (!trimmed) {
      setStatus('error');
      setErrorMessage('Please enter a URL');
      return;
    }

    const normalized = normalizeUrl(trimmed);
    if (!isValidUrl(normalized)) {
      setStatus('error');
      setErrorMessage(`Invalid URL: ${normalized}`);
      return;
    }

    setStatus('saving');
    setErrorMessage('');

    try {
      await ensureClientInit();
      await createLink({url: normalized, title: titleFromUrl(normalized)});
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStatus('success');
      setTimeout(closeShareExtension, 1200);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save link';
      setStatus('error');
      setErrorMessage(message);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  if (status === 'saving') {
    return (
      <View style={styles.container}>
        <View style={styles.statusContainer}>
          <Image source={schwankieLogo} style={styles.logo} />
          <ActivityIndicator size="large" color="#5b6f8a" style={styles.statusSpinner} />
          <Text style={styles.statusText}>Saving link…</Text>
        </View>
      </View>
    );
  }

  if (status === 'success') {
    return (
      <View style={styles.container}>
        <View style={styles.statusContainer}>
          <Image source={schwankieLogo} style={styles.logo} />
          <Text style={styles.successGlyph}>✓</Text>
          <Text style={styles.statusText}>Saved to Schwankie</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={schwankieLogo} style={styles.headerLogo} />
        <Text style={styles.title}>Save to Schwankie</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Link</Text>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={(value) => {
            setUrl(value);
            if (status === 'error') {
              setStatus('idle');
              setErrorMessage('');
            }
          }}
          placeholder="https://…"
          placeholderTextColor="#a89d8a"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          multiline
          selectTextOnFocus
        />
        {status === 'error' && errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={closeShareExtension}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.saveButton, !url.trim() && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={!url.trim()}
        >
          <Text style={styles.saveButtonText}>Save Link</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f3ed',
    padding: 20,
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  headerLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e1e1e',
  },
  field: {
    flex: 1,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b6459',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#fdfbf6',
    borderWidth: 1,
    borderColor: '#e0d8c7',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e1e1e',
    minHeight: 72,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#e4dccb',
  },
  cancelButtonText: {
    color: '#3d342a',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#5b6f8a',
  },
  saveButtonText: {
    color: '#f7f3ed',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  statusContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 16,
    marginBottom: 20,
  },
  statusSpinner: {
    marginBottom: 12,
  },
  statusText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#1e1e1e',
  },
  successGlyph: {
    fontSize: 44,
    color: '#5b6f8a',
    marginBottom: 8,
    fontWeight: '600',
  },
  errorText: {
    color: '#b34040',
    fontSize: 14,
    marginTop: 8,
  },
});
