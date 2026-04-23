import { View, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Link } from 'expo-router';
import { useColors } from '../../theme/use-colors';
import { LoadingState, ErrorState, EmptyState } from '../../components/ListStates';
import { useListFeeds, useTriggerRefreshAllFeeds } from '../../services/feeds';
import { FeedRow } from '../../components/FeedRow';

export default function FeedsScreen() {
  const colors = useColors();
  const { data: feeds, isLoading, error, refetch } = useListFeeds();
  const { mutate: triggerRefresh, isPending: isRefreshing } = useTriggerRefreshAllFeeds();

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
        title="Error loading feeds"
        message={error instanceof Error ? error.message : 'Unknown error'}
        colors={colors}
      />
    );
  }

  if (!feeds || feeds.length === 0) {
    return (
      <EmptyState
        title="No feeds"
        message="Subscribe to RSS feeds to get started"
        colors={colors}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={feeds}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Link href={`/feeds/${item.id}`} asChild>
            <TouchableOpacity>
              <FeedRow feed={item} colors={colors} />
            </TouchableOpacity>
          </Link>
        )}
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
