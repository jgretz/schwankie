import { View, Text } from 'react-native';
import type { LinkData } from 'client';

type LinkRowProps = {
  link: LinkData;
  colors: {
    bg: string;
    text: string;
    textMuted: string;
    border: string;
    card: string;
  };
};

export function LinkRow({ link, colors }: LinkRowProps) {
  const date = new Date(link.createDate).toLocaleDateString();
  const url = new URL(link.url).hostname;

  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.card,
      }}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: '600',
          color: colors.text,
          marginBottom: 4,
        }}
        numberOfLines={2}
      >
        {link.title}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text
          style={{
            fontSize: 12,
            color: colors.textMuted,
          }}
          numberOfLines={1}
        >
          {url}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: colors.textMuted,
          }}
        >
          {date}
        </Text>
      </View>
    </View>
  );
}
