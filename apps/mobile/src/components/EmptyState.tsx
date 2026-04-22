import { View, Text } from 'react-native';

type EmptyStateProps = {
  title: string;
  message: string;
  colors: {
    bg: string;
    text: string;
    textMuted: string;
  };
};

export function EmptyState({ title, message, colors }: EmptyStateProps) {
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
