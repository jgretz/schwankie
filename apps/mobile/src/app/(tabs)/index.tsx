import {View, FlatList, ActivityIndicator, RefreshControl} from 'react-native';
import {useState} from 'react';
import Toast from 'react-native-toast-message';
import {useColors} from '../../theme/use-colors';
import {LinkRow} from '../../components/LinkRow';
import {LinkActions} from '../../components/LinkActions';
import {EmptyState} from '../../components/EmptyState';
import {useDeleteLink, useLinks, useUpdateLink} from '../../services/links';

export default function QueueScreen() {
  const colors = useColors();
  const [pendingPromoteId, setPendingPromoteId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useLinks('queued');

  const {mutate: updateLink, isPending: isPromoting} = useUpdateLink();
  const {mutate: deleteLink, isPending: isDeleting} = useDeleteLink();

  const links = data?.pages.flatMap((page) => page.items) ?? [];

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handlePromote = (id: number) => {
    setPendingPromoteId(id);
    updateLink(
      {id, data: {status: 'saved'}},
      {
        onSuccess: () => {
          Toast.show({type: 'success', text1: 'Added to Compendium'});
        },
        onSettled: () => setPendingPromoteId(null),
      },
    );
  };

  const handleDelete = (id: number) => {
    setPendingDeleteId(id);
    deleteLink(id, {
      onSuccess: () => {
        Toast.show({type: 'success', text1: 'Link deleted'});
      },
      onSettled: () => setPendingDeleteId(null),
    });
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.bg,
        }}
      >
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{flex: 1, backgroundColor: colors.bg}}>
        <EmptyState title="Error loading links" message={error.message} colors={colors} />
      </View>
    );
  }

  if (links.length === 0) {
    return (
      <View style={{flex: 1, backgroundColor: colors.bg}}>
        <EmptyState title="Queue empty" message="No queued links yet" colors={colors} />
      </View>
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: colors.bg}}>
      <FlatList
        data={links}
        keyExtractor={(item) => String(item.id)}
        renderItem={({item}) => (
          <View>
            <LinkRow link={item} colors={colors} />
            <LinkActions
              url={item.url}
              onPromote={() => handlePromote(item.id)}
              onDelete={() => handleDelete(item.id)}
              isPromoting={pendingPromoteId === item.id && isPromoting}
              isDeleting={pendingDeleteId === item.id && isDeleting}
              colors={colors}
            />
          </View>
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
            <View style={{paddingVertical: 20, alignItems: 'center'}}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : null
        }
        contentContainerStyle={{paddingBottom: 20}}
      />
    </View>
  );
}
