import _ from 'lodash';

export default {
  test: req => req.query.random,
  find: async (req, res, col) => {
    const query = `
      SELECT TOP 150 l.id, l.url, l.title, l.description, l.tags, l.image
      FROM links l
      ORDER BY l.date DESC
    `;

    const results = await col.query(query);
    const shuffled = _.shuffle(results);

    res.json(shuffled.slice(0, 25));
  },
};
