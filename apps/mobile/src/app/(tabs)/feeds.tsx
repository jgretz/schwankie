import { View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Link } from 'expo-router';
import { useColors } from '../../theme/use-colors';
import { EmptyState } from '../../components/EmptyState';
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
          title="Error loading feeds"
          message={error instanceof Error ? error.message : 'Unknown error'}
          colors={colors}
        />
      </View>
    );
  }

  if (!feeds || feeds.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <EmptyState
          title="No feeds"
          message="Subscribe to RSS feeds to get started"
          colors={colors}
        />
      </View>
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
