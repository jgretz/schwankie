import * as R from 'ramda';

const FOOD_TAGS = [
  'food',
  'recipe',
  'baking',
  'coffee',
  'chicken',
  'cookies',
  'bread',
  'soup',
  'instantpot',
  'breakfast',
];
const TECH_TAGS = [
  'tech',
  'react',
  'javascript',
  'programming',
  'ai',
  'ml',
  'software',
  'technology',
  'development',
];
const BUSINESS_TAGS = ['business', 'career', 'interview', 'life', 'startup'];
const SPORTS_TAGS = ['sports', 'running', 'basketball', 'football', 'soccer', 'races', 'shoes'];

const tagBgColorMap = {
  food: 'accent_salmon',
  tech: 'accent_dark_green',
  business: 'accent_light_green',
  sports: 'accent_blue',
};

const DEFAULT_COLOR = 'slate-300';

export function colorForTag(tag: string) {
  return colorForTags([tag]);
}

export function colorForTags(tags: string[]) {
  if (R.intersection(tags, FOOD_TAGS).length > 0) {
    return tagBgColorMap.food;
  }

  if (R.intersection(tags, TECH_TAGS).length > 0) {
    return tagBgColorMap.tech;
  }

  if (R.intersection(tags, BUSINESS_TAGS).length > 0) {
    return tagBgColorMap.business;
  }

  if (R.intersection(tags, SPORTS_TAGS).length > 0) {
    return tagBgColorMap.sports;
  }

  return DEFAULT_COLOR;
}
