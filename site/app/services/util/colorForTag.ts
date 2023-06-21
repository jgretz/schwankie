import * as R from 'ramda';

const RECIPE_TAGS = ['recipe', 'baking', 'coffee'];
const TECH_TAGS = ['react', 'javascript', 'programming', 'ai', 'ml', 'software', 'technology'];
const BUSINESS_TAGS = ['business', 'career', 'interview', 'life', 'startup'];
const SPORTS_TAGS = ['running', 'basketball', 'football', 'soccer'];

const tagBgColorMap = {
  food: 'accent_salmon',
  tech: 'accent_dark_green',
  business: 'accent_light_green',
  sports: 'accent_blue',
};

const DEFAULT_COLOR = 'fore_black';

export function colorForTag(tag: string) {
  return colorForTags([tag]);
}

export function colorForTags(tags: string[]) {
  if (R.intersection(tags, RECIPE_TAGS).length > 0) {
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
