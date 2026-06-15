import {memo, useCallback} from 'react';
import {View} from 'react-native';
import type {LinkData} from 'client';
import {LinkRow} from './LinkRow';
import {LinkActions} from './LinkActions';
import type {lightColors} from '../theme/colors';

type Colors = typeof lightColors;

type QueueLinkRowProps = {
  link: LinkData;
  colors: Colors;
  onPromote: (id: number) => void;
  onDelete: (id: number) => void;
  isPromoting: boolean;
  isDeleting: boolean;
};

function QueueLinkRowComponent({
  link,
  colors,
  onPromote,
  onDelete,
  isPromoting,
  isDeleting,
}: QueueLinkRowProps) {
  const handlePromote = useCallback(() => onPromote(link.id), [onPromote, link.id]);
  const handleDelete = useCallback(() => onDelete(link.id), [onDelete, link.id]);

  return (
    <View>
      <LinkRow link={link} colors={colors} />
      <LinkActions
        url={link.url}
        onPromote={handlePromote}
        onDelete={handleDelete}
        isPromoting={isPromoting}
        isDeleting={isDeleting}
        colors={colors}
      />
    </View>
  );
}

export const QueueLinkRow = memo(QueueLinkRowComponent);
