import _ from 'lodash';

const OR = 'or';

const applyFlag = (options, field) => {
  const sentinal = `${field}:`;

  if (options.terms[0].startsWith(sentinal)) {
    options.flags.push(field);
    options.terms[0] = _.trim(options.terms[0].replace(sentinal, ''));
  }
};

const optionsFromSearch = search => {
  const terms = search.split(',');
  if (terms.length === 0) {
    return null;
  }

  const options = {
    terms: terms.map(x => _.trim(x).toLowerCase()),
    flags: [],
  };

  applyFlag(options, 'title');
  applyFlag(options, 'description');
  applyFlag(options, 'tags');
  applyFlag(options, OR);

  return options;
};

const buildQuery = (options, field, func, toLower) => {
  const otherFlagSet = options.flags.filter(x => x !== OR && x !== field).length > 0;
  if (otherFlagSet) {
    return null;
  }

  const orFlag = options.flags.filter(x => x === OR).length > 0;
  const fieldExpr = toLower ? `LOWER(l.${field})` : `l.${field}`;
  return options.terms.map(t => `${func}(${fieldExpr}, "${t}")`).join(orFlag ? ' OR ' : ' AND ');
};

const buildTitleQuery = options => buildQuery(options, 'title', 'CONTAINS');
const buildDescriptionQuery = options => buildQuery(options, 'description', 'CONTAINS');
const buildTagsQuery = options => buildQuery(options, 'tags', 'ARRAY_CONTAINS');

export default {
  test: req => req.query.search,
  find: async (req, res, col) => {
    const options = optionsFromSearch(req.query.search);
    if (!options) {
      res.json([]);
      return;
    }

    const where = [
      buildTitleQuery(options),
      buildDescriptionQuery(options),
      buildTagsQuery(options),
    ].filter(x => x);

    const query = `
      SELECT l.id, l.url, l.title, l.description, l.tags, l.image
      FROM links l
      WHERE (${where.join(' OR ')})
    `;

    const results = await col.query(query);
    res.json(results);
  },
};
