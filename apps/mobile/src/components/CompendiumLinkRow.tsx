import {memo} from 'react';
import type {LinkData} from 'client';
import {LinkRow} from './LinkRow';
import {useOpenLink} from '../services/reader-pane';
import type {lightColors} from '../theme/colors';

type Colors = typeof lightColors;

type CompendiumLinkRowProps = {
  link: LinkData;
  colors: Colors;
};

function CompendiumLinkRowComponent({link, colors}: CompendiumLinkRowProps) {
  const openLink = useOpenLink();

  return (
    <LinkRow link={link} onOpen={() => openLink(link.url, 'CompendiumLinkRow')} colors={colors} />
  );
}

export const CompendiumLinkRow = memo(CompendiumLinkRowComponent);
