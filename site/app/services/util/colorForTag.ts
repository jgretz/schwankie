import * as R from 'ramda';

const RECIPE_TAGS = ['recipe', 'baking', 'coffee'];
const TECH_TAGS = ['react', 'javascript', 'programming', 'ai', 'ml', 'software', 'technology'];
const BUSINESS_TAGS = ['business', 'career', 'interview', 'life'];

const tagBgColorMap = {
  recipe: 'dark_cyan',
  tech: 'palatinate',
  business: 'caribbean_current',
};

const DEFAULT_COLOR = 'smoky_black';

export function colorForTag(tag: string) {
  return colorForTags([tag]);
}

export function colorForTags(tags: string[]) {
  if (R.intersection(tags, RECIPE_TAGS).length > 0) {
    return tagBgColorMap.recipe;
  }

  if (R.intersection(tags, TECH_TAGS).length > 0) {
    return tagBgColorMap.tech;
  }

  if (R.intersection(tags, BUSINESS_TAGS).length > 0) {
    return tagBgColorMap.business;
  }

  return DEFAULT_COLOR;
}
