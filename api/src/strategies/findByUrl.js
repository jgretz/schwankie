export default {
  test: req => req.query.url,
  find: async (req, res, col) => {
    const query = `
        SELECT l.id, l.url, l.title, l.description, l.tags, l.image
        FROM links l
        WHERE l.url = "${req.query.url}"
      `;

    const results = await col.query(query);
    res.json(results);
  },
};
