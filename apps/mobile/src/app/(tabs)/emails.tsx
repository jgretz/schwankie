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
import type {EmailItemData} from 'client';
import {useColors} from '../../theme/use-colors';
import {LoadingState, ErrorState, EmptyState} from '../../components/ListStates';
import {ItemActions} from '../../components/ItemActions';
import {
  useEmailItems,
  useMarkAllEmailItemsRead,
  useMarkEmailItemRead,
  usePromoteEmailItem,
  useTriggerRefreshEmails,
} from '../../services/emails';

export default function EmailsScreen() {
  const colors = useColors();
  const [unread, setUnread] = useState(true);
  const [selectedFrom, setSelectedFrom] = useState<string | null>(null);
  const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());
  const [pendingMarkReadId, setPendingMarkReadId] = useState<string | null>(null);
  const [pendingPromoteId, setPendingPromoteId] = useState<string | null>(null);

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useEmailItems({unread, from: selectedFrom ?? undefined});
  const {mutate: markRead, isPending: isMarkingRead} = useMarkEmailItemRead();
  const {mutate: promote, isPending: isPromoting} = usePromoteEmailItem();
  const {mutate: markAllRead, isPending: isMarkingAllRead} = useMarkAllEmailItemsRead();
  const {mutate: triggerRefresh, isPending: isRefreshing} = useTriggerRefreshEmails();

  const items = useMemo<EmailItemData[]>(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );
  const visibleItems = useMemo(
    () => items.filter((item) => !hiddenItems.has(item.id)),
    [items, hiddenItems],
  );
  const total = data?.pages[0]?.total ?? 0;

  const senderOptions = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) set.add(item.emailFrom);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const handleRefresh = () => {
    triggerRefresh();
    refetch();
  };

  const handleMarkRead = (item: EmailItemData) => {
    setPendingMarkReadId(item.id);
    markRead(item.id, {
      onSuccess: () => setHiddenItems((prev) => new Set([...prev, item.id])),
      onSettled: () => setPendingMarkReadId(null),
    });
  };

  const handlePromote = (item: EmailItemData) => {
    setPendingPromoteId(item.id);
    promote(item.id, {
      onSuccess: () => setHiddenItems((prev) => new Set([...prev, item.id])),
      onSettled: () => setPendingPromoteId(null),
    });
  };

  const renderItem = ({item}: {item: EmailItemData}) => {
    const d = new Date(item.importedAt);
    const displayDate = `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    })}`;

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
            {item.title || '(No subject)'}
          </Text>
          {item.description && (
            <Text
              style={{fontSize: 12, color: colors.textMuted, marginBottom: 8}}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          )}
          <Text style={{fontSize: 11, color: colors.textFaint}} numberOfLines={1}>
            {item.emailFrom} · {displayDate}
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
            onPress={() => markAllRead(selectedFrom ?? undefined)}
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
          onPress={() => setSelectedFrom(null)}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
            backgroundColor: selectedFrom === null ? colors.accent : colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: selectedFrom === null ? colors.bg : colors.text,
            }}
          >
            All senders
          </Text>
        </TouchableOpacity>
        {senderOptions.map((from) => (
          <TouchableOpacity
            key={from}
            onPress={() => setSelectedFrom(from)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              backgroundColor: selectedFrom === from ? colors.accent : colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: selectedFrom === from ? colors.bg : colors.text,
              }}
            >
              {from}
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
        title="Error loading emails"
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
            title={unread ? 'No unread emails' : 'No emails'}
            message={unread ? 'Pull to refresh' : 'Email items will appear here'}
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
