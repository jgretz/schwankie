import { View, FlatList, Text, RefreshControl, ScrollView, TouchableOpacity } from 'react-native';
import { useState, useMemo } from 'react';
import { useColors } from '../../theme/use-colors';
import { LoadingState, ErrorState, EmptyState } from '../../components/ListStates';
import { ItemActions } from '../../components/ItemActions';
import { useListEmailItems, useMarkEmailItemRead, usePromoteEmailItem, useTriggerRefreshEmails } from '../../services/emails';
import type { EmailItemData } from 'client';

export default function EmailsScreen() {
  const colors = useColors();
  const { data, isLoading, error, refetch } = useListEmailItems();
  const { mutate: markRead, isPending: isMarkingRead } = useMarkEmailItemRead();
  const { mutate: promote, isPending: isPromoting } = usePromoteEmailItem();
  const { mutate: triggerRefresh, isPending: isRefreshing } = useTriggerRefreshEmails();
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const groupedItems = useMemo(() => {
    if (!data?.items) return {};

    const grouped = data.items.reduce(
      (acc, item) => {
        if (!acc[item.emailFrom]) {
          acc[item.emailFrom] = [];
        }
        acc[item.emailFrom].push(item);
        return acc;
      },
      {} as Record<string, EmailItemData[]>,
    );

    return grouped;
  }, [data]);

  const groupedKeys = useMemo(() => Object.keys(groupedItems).sort(), [groupedItems]);

  const filteredKeys = useMemo(
    () => (selectedFilter ? groupedKeys.filter((key) => key === selectedFilter) : groupedKeys),
    [groupedKeys, selectedFilter],
  );

  const handleRefresh = () => {
    triggerRefresh();
    refetch();
  };

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

  if (groupedKeys.length === 0) {
    return (
      <EmptyState
        title="No emails"
        message="Email items will appear here"
        colors={colors}
      />
    );
  }

  const flatData: Array<{ type: 'group' | 'item'; from?: string; item?: EmailItemData; key: string }> = [];
  for (const from of filteredKeys) {
    flatData.push({ type: 'group', from, key: `group-${from}` });
    for (const item of groupedItems[from]) {
      flatData.push({ type: 'item', item, key: item.id });
    }
  }

  const renderItem = ({ item: dataItem }: { item: (typeof flatData)[0] }) => {
    if (dataItem.type === 'group') {
      return (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: colors.bg,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: colors.textMuted,
              textTransform: 'uppercase',
            }}
          >
            {dataItem.from}
          </Text>
        </View>
      );
    }

    const item = dataItem.item!;
    return (
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
            {item.title || '(No subject)'}
          </Text>
          {item.description && (
            <Text
              style={{
                fontSize: 12,
                color: colors.textMuted,
                marginBottom: 8,
              }}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          )}
          <Text
            style={{
              fontSize: 11,
              color: colors.textMuted,
            }}
          >
            {new Date(item.importedAt).toLocaleString()}
          </Text>
        </View>
        <ItemActions
          url={item.link}
          onMarkRead={() => markRead(item.id)}
          onPromote={() => promote(item.id)}
          isMarkingRead={isMarkingRead}
          isPromoting={isPromoting}
          colors={colors}
        />
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}
      >
        <TouchableOpacity
          onPress={() => setSelectedFilter(null)}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
            backgroundColor: selectedFilter === null ? colors.accent : colors.border,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: selectedFilter === null ? colors.bg : colors.text }}>
            All
          </Text>
        </TouchableOpacity>
        {groupedKeys.map((from) => (
          <TouchableOpacity
            key={from}
            onPress={() => setSelectedFilter(from)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              backgroundColor: selectedFilter === from ? colors.accent : colors.border,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: selectedFilter === from ? colors.bg : colors.text }}>
              {from}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <FlatList
        data={flatData}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}
