import { View, Text, ActivityIndicator } from 'react-native';

type StateProps = {
  title: string;
  message: string;
  colors: {
    bg: string;
    text: string;
    textMuted: string;
    accent: string;
  };
};

export function LoadingState({ colors }: Omit<StateProps, 'title' | 'message'>) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.bg,
      }}
    >
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}

export function ErrorState({ title, message, colors }: StateProps) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.bg,
        paddingHorizontal: 20,
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: '600',
          color: colors.text,
          marginBottom: 8,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: colors.textMuted,
          textAlign: 'center',
        }}
      >
        {message}
      </Text>
    </View>
  );
}

export function EmptyState({ title, message, colors }: StateProps) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.bg,
        paddingHorizontal: 20,
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: '600',
          color: colors.text,
          marginBottom: 8,
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: colors.textMuted,
          textAlign: 'center',
        }}
      >
        {message}
      </Text>
    </View>
  );
}
