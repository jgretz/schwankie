import { View, Text } from 'react-native';
import type { FeedData } from 'client';

type FeedRowProps = {
  feed: FeedData;
  colors: {
    text: string;
    textMuted: string;
    border: string;
    card: string;
  };
};

export function FeedRow({ feed, colors }: FeedRowProps) {
  const date = new Date(feed.createdAt).toLocaleDateString();

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
        numberOfLines={1}
      >
        {feed.name}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text
          style={{
            fontSize: 12,
            color: colors.textMuted,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {feed.sourceUrl}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: colors.textMuted,
            marginLeft: 8,
          }}
        >
          {date}
        </Text>
      </View>
      {feed.lastError && (
        <Text
          style={{
            fontSize: 12,
            color: '#d97706',
            marginTop: 4,
          }}
          numberOfLines={1}
        >
          Error: {feed.lastError}
        </Text>
      )}
    </View>
  );
}
