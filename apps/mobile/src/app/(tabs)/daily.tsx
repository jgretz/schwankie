import {View, FlatList, Text, RefreshControl, TouchableOpacity} from 'react-native';
import {useState} from 'react';
import type {DailySummaryData, DigestTopic} from 'client';
import {useColors} from '../../theme/use-colors';
import {LoadingState, ErrorState, EmptyState} from '../../components/ListStates';
import {formatSummaryDate} from '../../lib/format-summary-date';
import {resolveAdjacentDates} from '../../lib/resolve-adjacent-dates';
import {useDailySummary, useDailySummaryDates} from '../../services/daily-summary';
import {openLink} from '../../services/open-link';

type Colors = ReturnType<typeof useColors>;

function pluralizeLinks(count: number): string {
  return `${count} ${count === 1 ? 'link' : 'links'}`;
}

export default function DailyScreen() {
  const colors = useColors();
  const [date, setDate] = useState<string | undefined>(undefined);

  const {data: summary, isLoading, error, refetch, isFetching} = useDailySummary(date);
  const {data: dates, refetch: refetchDates} = useDailySummaryDates();

  // Which day we are actually looking at — the loaded digest's own date, so the
  // controls work even when the screen opened without one selected.
  const activeDate = summary?.summaryDate ?? date;
  const {previousDate, nextDate} = resolveAdjacentDates(dates, activeDate);

  const handleRefresh = () => {
    refetch();
    refetchDates();
  };

  const renderItem = ({item}: {item: DigestTopic}) => <TopicCard topic={item} colors={colors} />;

  if (isLoading) {
    return <LoadingState colors={colors} />;
  }

  if (error) {
    return (
      <ErrorState
        title="Error loading digest"
        message={error instanceof Error ? error.message : 'Unknown error'}
        colors={colors}
      />
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: colors.bg}}>
      <FlatList
        data={summary?.topics ?? []}
        keyExtractor={(topic) => String(topic.rank)}
        renderItem={renderItem}
        ListHeaderComponent={
          <DigestHeader
            summary={summary}
            previousDate={previousDate}
            nextDate={nextDate}
            onSelectDate={setDate}
            colors={colors}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title={summary ? 'No topics' : 'No digest yet'}
            message={
              summary
                ? 'Nothing notable came in over this window.'
                : 'No digest for this day yet. The first one lands at 7am.'
            }
            colors={colors}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
        contentContainerStyle={{paddingBottom: 20, flexGrow: 1}}
      />
    </View>
  );
}

/**
 * Rendered as an element rather than passed to `ListHeaderComponent` as a
 * function, so a re-render of the screen re-renders the header instead of
 * remounting it under a freshly-created component type.
 */
function DigestHeader({
  summary,
  previousDate,
  nextDate,
  onSelectDate,
  colors,
}: {
  summary: DailySummaryData | null | undefined;
  previousDate: string | undefined;
  nextDate: string | undefined;
  onSelectDate: (date: string) => void;
  colors: Colors;
}) {
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        {summary ? (
          <Text style={{flex: 1, fontSize: 12, color: colors.textFaint}}>
            {formatSummaryDate(summary.summaryDate)} · {pluralizeLinks(summary.itemCount)} over{' '}
            {summary.lookbackHours}h
            {summary.topics.length > 0
              ? ` · ${summary.coveredCount} in ${summary.topics.length} topics`
              : ''}
          </Text>
        ) : (
          <View style={{flex: 1}} />
        )}
        <View style={{flexDirection: 'row', gap: 8}}>
          <DayNavButton
            label="← Older"
            accessibilityLabel="Previous digest"
            target={previousDate}
            onSelectDate={onSelectDate}
            colors={colors}
          />
          <DayNavButton
            label="Newer →"
            accessibilityLabel="Next digest"
            target={nextDate}
            onSelectDate={onSelectDate}
            colors={colors}
          />
        </View>
      </View>

      {summary?.notable ? (
        <View
          style={{
            marginTop: 12,
            borderLeftWidth: 2,
            borderLeftColor: colors.accent,
            paddingLeft: 12,
          }}
        >
          <Text style={{fontSize: 14, lineHeight: 21, color: colors.textMuted}}>
            {summary.notable}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** A day step. No target means that end of the digest list, so it is disabled. */
function DayNavButton({
  label,
  accessibilityLabel,
  target,
  onSelectDate,
  colors,
}: {
  label: string;
  accessibilityLabel: string;
  target: string | undefined;
  onSelectDate: (date: string) => void;
  colors: Colors;
}) {
  return (
    <TouchableOpacity
      onPress={() => target && onSelectDate(target)}
      disabled={!target}
      accessibilityLabel={accessibilityLabel}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: colors.border,
        opacity: target ? 1 : 0.4,
      }}
    >
      <Text style={{fontSize: 12, color: colors.text}}>{label}</Text>
    </TouchableOpacity>
  );
}

function TopicCard({topic, colors}: {topic: DigestTopic; colors: Colors}) {
  return (
    <View
      style={{
        marginHorizontal: 16,
        marginTop: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        backgroundColor: colors.card,
      }}
    >
      <View style={{flexDirection: 'row', alignItems: 'baseline', gap: 8}}>
        <Text style={{flex: 1, fontSize: 16, fontWeight: '600', color: colors.text}}>
          {topic.title}
        </Text>
        <Text style={{fontSize: 11, color: colors.textFaint}}>
          {pluralizeLinks(topic.itemCount)}
        </Text>
      </View>

      <Text style={{marginTop: 6, fontSize: 13, lineHeight: 20, color: colors.textMuted}}>
        {topic.body}
      </Text>

      {topic.links.length > 0 ? (
        <View
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            gap: 8,
          }}
        >
          {topic.links.map((link) => (
            <View key={link.url} style={{flexDirection: 'row', alignItems: 'baseline', gap: 8}}>
              <TouchableOpacity
                style={{flex: 1}}
                onPress={() => openLink({url: link.url, colors, source: 'DailyScreen'})}
              >
                <Text style={{fontSize: 13, color: colors.text}}>{link.title}</Text>
              </TouchableOpacity>
              <Text style={{fontSize: 11, color: colors.textFaint}}>{link.source}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
