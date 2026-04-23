import {
  View,
  FlatList,
  Text,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useMemo, useState} from 'react';
import type {RssItemWithFeedData} from 'client';
import {useColors} from '../../theme/use-colors';
import {LoadingState, ErrorState, EmptyState} from '../../components/ListStates';
import {ItemActions} from '../../components/ItemActions';
import {
  useAllRssItems,
  useListFeeds,
  useMarkAllRssItemsRead,
  useMarkRssItemRead,
  usePromoteRssItem,
  useTriggerRefreshAllFeeds,
} from '../../services/feeds';

export default function FeedsScreen() {
  const colors = useColors();
  const [unread, setUnread] = useState(true);
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);
  const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());
  const [pendingMarkReadId, setPendingMarkReadId] = useState<string | null>(null);
  const [pendingPromoteId, setPendingPromoteId] = useState<string | null>(null);

  const {data: feedsData} = useListFeeds();
  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAllRssItems({unread, feedId: selectedFeedId ?? undefined});
  const {mutate: markRead, isPending: isMarkingRead} = useMarkRssItemRead();
  const {mutate: promote, isPending: isPromoting} = usePromoteRssItem();
  const {mutate: markAllRead, isPending: isMarkingAllRead} = useMarkAllRssItemsRead();
  const {mutate: triggerRefresh, isPending: isRefreshing} = useTriggerRefreshAllFeeds();

  const items = useMemo<RssItemWithFeedData[]>(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );
  const visibleItems = useMemo(
    () => items.filter((item) => !hiddenItems.has(item.id)),
    [items, hiddenItems],
  );
  const total = data?.pages[0]?.total ?? 0;

  const feedOptions = useMemo(() => {
    const feeds = feedsData ?? [];
    return [...feeds].filter((f) => !f.disabled).sort((a, b) => a.name.localeCompare(b.name));
  }, [feedsData]);

  const handleRefresh = () => {
    triggerRefresh();
    refetch();
  };

  const handleMarkRead = (item: RssItemWithFeedData) => {
    setPendingMarkReadId(item.id);
    markRead(
      {feedId: item.feedId, itemId: item.id},
      {
        onSuccess: () => setHiddenItems((prev) => new Set([...prev, item.id])),
        onSettled: () => setPendingMarkReadId(null),
      },
    );
  };

  const handlePromote = (item: RssItemWithFeedData) => {
    setPendingPromoteId(item.id);
    promote(
      {feedId: item.feedId, itemId: item.id},
      {
        onSuccess: () => setHiddenItems((prev) => new Set([...prev, item.id])),
        onSettled: () => setPendingPromoteId(null),
      },
    );
  };

  const renderItem = ({item}: {item: RssItemWithFeedData}) => {
    const createdMs = new Date(item.createdAt).getTime();
    const publishedMs = item.publishedAt ? new Date(item.publishedAt).getTime() : null;
    const displayMs =
      publishedMs !== null && publishedMs <= createdMs ? publishedMs : createdMs;
    const displayDate = new Date(displayMs).toLocaleString();

    return (
      <View
        style={{
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{paddingHorizontal: 16, paddingVertical: 12}}>
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
              style={{fontSize: 12, color: colors.textMuted, marginBottom: 8}}
              numberOfLines={2}
            >
              {item.summary}
            </Text>
          )}
          <Text style={{fontSize: 11, color: colors.textFaint}}>
            {item.feedName} · {displayDate}
          </Text>
        </View>
        <ItemActions
          url={item.link}
          onMarkRead={() => handleMarkRead(item)}
          onPromote={() => handlePromote(item)}
          isMarkingRead={pendingMarkReadId === item.id && isMarkingRead}
          isPromoting={pendingPromoteId === item.id && isPromoting}
          colors={colors}
        />
      </View>
    );
  };

  const renderHeader = () => (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.bg,
        }}
      >
        <Text style={{fontSize: 12, color: colors.textMuted}}>
          {visibleItems.length} of {total} {unread ? 'unread ' : ''}item
          {total !== 1 ? 's' : ''}
        </Text>
        <View style={{flexDirection: 'row', gap: 8}}>
          <TouchableOpacity
            onPress={() => markAllRead(selectedFeedId ?? undefined)}
            disabled={isMarkingAllRead}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: isMarkingAllRead ? 0.5 : 1,
            }}
          >
            <Text style={{fontSize: 12, color: colors.text}}>
              {isMarkingAllRead ? 'Marking…' : 'Mark all read'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleRefresh}
            disabled={isRefreshing}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: isRefreshing ? 0.5 : 1,
            }}
          >
            <Text style={{fontSize: 12, color: colors.text}}>
              {isRefreshing ? 'Refreshing…' : 'Refresh'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{borderBottomWidth: 1, borderBottomColor: colors.border}}
        contentContainerStyle={{paddingHorizontal: 12, paddingVertical: 8, gap: 8}}
      >
        <TouchableOpacity
          onPress={() => setUnread(!unread)}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
            backgroundColor: unread ? colors.accent : colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: unread ? colors.bg : colors.text,
            }}
          >
            {unread ? 'Unread' : 'All'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSelectedFeedId(null)}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
            backgroundColor: selectedFeedId === null ? colors.accent : colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: selectedFeedId === null ? colors.bg : colors.text,
            }}
          >
            All sources
          </Text>
        </TouchableOpacity>
        {feedOptions.map((feed) => (
          <TouchableOpacity
            key={feed.id}
            onPress={() => setSelectedFeedId(feed.id)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              backgroundColor: selectedFeedId === feed.id ? colors.accent : colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: selectedFeedId === feed.id ? colors.bg : colors.text,
              }}
            >
              {feed.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

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

  return (
    <View style={{flex: 1, backgroundColor: colors.bg}}>
      <FlatList
        data={visibleItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        stickyHeaderIndices={[0]}
        ListEmptyComponent={
          <EmptyState
            title={unread ? 'No unread items' : 'No items'}
            message={
              unread
                ? 'Subscribe to feeds or pull to refresh'
                : 'Subscribe to RSS feeds to get started'
            }
            colors={colors}
          />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={{paddingVertical: 16, alignItems: 'center'}}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
        contentContainerStyle={{paddingBottom: 20, flexGrow: 1}}
      />
    </View>
  );
}
