import { View, FlatList, Text } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useColors } from '../../theme/use-colors';
import { LoadingState, ErrorState, EmptyState } from '../../components/ListStates';
import { ItemActions } from '../../components/ItemActions';
import { useFeedItems, useMarkRssItemRead, usePromoteRssItem } from '../../services/feeds';
import type { RssItemData } from 'client';

export default function FeedDetailScreen() {
  const colors = useColors();
  const { id: feedId } = useLocalSearchParams();
  const [pendingMarkReadId, setPendingMarkReadId] = useState<string | null>(null);
  const [pendingPromoteId, setPendingPromoteId] = useState<string | null>(null);

  const { data, isLoading, error } = useFeedItems(String(feedId));
  const { mutate: markRead, isPending: isMarkingRead } = useMarkRssItemRead();
  const { mutate: promote, isPending: isPromoting } = usePromoteRssItem();

  const items = data?.items || [];

  if (isLoading) {
    return <LoadingState colors={colors} />;
  }

  if (error) {
    return (
      <ErrorState
        title="Error loading items"
        message={error instanceof Error ? error.message : 'Unknown error'}
        colors={colors}
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No items"
        message="No feed items available"
        colors={colors}
      />
    );
  }

  const renderItem = ({ item }: { item: RssItemData }) => (
    <View style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 4,
            opacity: item.read ? 0.6 : 1,
          }}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        {item.summary && (
          <Text
            style={{
              fontSize: 12,
              color: colors.textMuted,
              marginBottom: 8,
            }}
            numberOfLines={2}
          >
            {item.summary}
          </Text>
        )}
        <Text
          style={{
            fontSize: 11,
            color: colors.textMuted,
          }}
        >
          {new Date(item.publishedAt || item.createdAt).toLocaleString()}
        </Text>
      </View>
      <ItemActions
        url={item.link}
        onMarkRead={() => {
          setPendingMarkReadId(item.id);
          markRead({ feedId: String(feedId), itemId: item.id }, {
            onSettled: () => setPendingMarkReadId(null),
          });
        }}
        onPromote={() => {
          setPendingPromoteId(item.id);
          promote({ feedId: String(feedId), itemId: item.id }, {
            onSettled: () => setPendingPromoteId(null),
          });
        }}
        isMarkingRead={pendingMarkReadId === item.id && isMarkingRead}
        isPromoting={pendingPromoteId === item.id && isPromoting}
        colors={colors}
      />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}
