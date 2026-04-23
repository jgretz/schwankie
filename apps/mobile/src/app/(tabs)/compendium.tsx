import {
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import {useMemo, useState} from 'react';
import {MaterialIcons} from '@expo/vector-icons';
import {useColors} from '../../theme/use-colors';
import {LinkRow} from '../../components/LinkRow';
import {LinkActions} from '../../components/LinkActions';
import {EmptyState} from '../../components/EmptyState';
import {FilterStrip} from '../../components/FilterStrip';
import {TagsDrawer} from '../../components/TagsDrawer';
import {useLinks, useLinkTags} from '../../services/links';

export default function CompendiumScreen() {
  const colors = useColors();
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const q = searchQuery.trim() || undefined;
  const tagsParam = selectedTags.length > 0 ? selectedTags.join(',') : undefined;

  const submitSearch = () => {
    setSearchQuery(searchInput);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useLinks('saved', {q, tags: tagsParam});

  const {data: tags = []} = useLinkTags('saved');

  const links = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const toggleTag = (tagText: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagText) ? prev.filter((t) => t !== tagText) : [...prev, tagText],
    );
  };

  const removeTag = (tagText: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tagText));
  };

  const clearAll = () => {
    setSelectedTags([]);
    clearSearch();
  };

  return (
    <View style={{flex: 1, backgroundColor: colors.bg}}>
      <View style={{backgroundColor: colors.bg}}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.bg,
          }}
        >
          <TouchableOpacity
            onPress={() => setDrawerOpen(true)}
            style={{
              padding: 6,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: selectedTags.length > 0 ? colors.accent : colors.border,
            }}
            accessibilityLabel="Open tag filters"
          >
            <MaterialIcons
              name="filter-list"
              size={18}
              color={selectedTags.length > 0 ? colors.accent : colors.textMuted}
            />
          </TouchableOpacity>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 10,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
            }}
          >
            <TouchableOpacity onPress={submitSearch} accessibilityLabel="Search">
              <MaterialIcons name="search" size={14} color={colors.textFaint} />
            </TouchableOpacity>
            <TextInput
              value={searchInput}
              onChangeText={setSearchInput}
              onSubmitEditing={submitSearch}
              placeholder="Search links…"
              placeholderTextColor={colors.textFaint}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              style={{
                flex: 1,
                fontSize: 13,
                color: colors.text,
                paddingVertical: 8,
              }}
            />
            {(searchInput.length > 0 || searchQuery.length > 0) && (
              <TouchableOpacity onPress={clearSearch} accessibilityLabel="Clear search">
                <MaterialIcons name="close" size={14} color={colors.textFaint} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <FilterStrip
          activeTags={selectedTags}
          searchQuery={q}
          onRemoveTag={removeTag}
          onClearSearch={clearSearch}
          onClearAll={clearAll}
          colors={colors}
        />
      </View>

      <FlatList
        data={links}
        keyExtractor={(item) => String(item.id)}
        renderItem={({item}) => (
          <View>
            <LinkRow link={item} colors={colors} />
            <LinkActions url={item.url} colors={colors} />
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
        ListEmptyComponent={
          isLoading ? (
            <View style={{paddingVertical: 40, alignItems: 'center'}}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          ) : error ? (
            <EmptyState title="Error loading links" message={error.message} colors={colors} />
          ) : (
            <EmptyState
              title={q || selectedTags.length > 0 ? 'No matches' : 'Compendium empty'}
              message={
                q || selectedTags.length > 0
                  ? 'Try a different search or tag'
                  : 'Saved links will appear here'
              }
              colors={colors}
            />
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={{paddingVertical: 20, alignItems: 'center'}}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : null
        }
        contentContainerStyle={{paddingBottom: 20, flexGrow: 1}}
        keyboardShouldPersistTaps="handled"
      />
      <TagsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        tags={tags}
        selectedTags={selectedTags}
        onToggle={toggleTag}
        onClear={() => setSelectedTags([])}
        colors={colors}
      />
    </View>
  );
}
