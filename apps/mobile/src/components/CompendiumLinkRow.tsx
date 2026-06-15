import {memo} from 'react';
import {View} from 'react-native';
import type {LinkData} from 'client';
import {LinkRow} from './LinkRow';
import {LinkActions} from './LinkActions';
import type {lightColors} from '../theme/colors';

type Colors = typeof lightColors;

type CompendiumLinkRowProps = {
  link: LinkData;
  colors: Colors;
};

function CompendiumLinkRowComponent({link, colors}: CompendiumLinkRowProps) {
  return (
    <View>
      <LinkRow link={link} colors={colors} />
      <LinkActions url={link.url} colors={colors} />
    </View>
  );
}

export const CompendiumLinkRow = memo(CompendiumLinkRowComponent);
