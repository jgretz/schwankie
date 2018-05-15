
export default {
  test: req => req.query.recent,
  find: async (req, res, col) => {
    const query = `
      SELECT TOP ${req.query.recent} l.id, l.url, l.title, l.description, l.tags, l.image
      FROM links l
      ORDER BY l.date DESC
    `;

    const results = await col.query(query);
    res.json(results);
  },
};
