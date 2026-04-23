import { View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchLinks } from 'client';
import { useColors } from '../../theme/use-colors';
import { LinkRow } from '../../components/LinkRow';
import { EmptyState } from '../../components/EmptyState';

const PAGE_SIZE = 25;

export default function QueueScreen() {
  const colors = useColors();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['links', 'queued'],
    queryFn: async ({ pageParam = 0 }) => {
      return fetchLinks({
        status: 'queued',
        limit: PAGE_SIZE,
        offset: pageParam,
      });
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextOffset : undefined;
    },
    initialPageParam: 0,
  });

  const links = data?.pages.flatMap((page) => page.items) ?? [];

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleLinkPress = async (url: string) => {
    await WebBrowser.openBrowserAsync(url);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <EmptyState
          title="Error loading links"
          message={error.message}
          colors={colors}
        />
      </View>
    );
  }

  if (links.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <EmptyState
          title="Queue empty"
          message="No queued links yet"
          colors={colors}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={links}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleLinkPress(item.url)}>
            <LinkRow link={item} colors={colors} />
          </TouchableOpacity>
        )}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.accent}
          />
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}
