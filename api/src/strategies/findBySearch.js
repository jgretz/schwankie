export default {
  test: req => req.query.search,
  find: async (req, res, col) => {
    const terms = req.query.search.split(',');
    if (terms.length === 0) {
      res.json([]);
      return;
    }

    const titleSearch = terms.map(t => `CONTAINS(l.title, "${t}")`).join(' OR ');
    const descriptionSearch = terms.map(t => `CONTAINS(l.description, "${t}")`).join(' OR ');
    const tagSearch = terms.map(t => `ARRAY_CONTAINS(l.tags, "${t}")`).join(' OR ');

    const query = `
        SELECT l.id,, l.url, l.title, l.description, l.tags, l.image
        FROM links l
        WHERE (
          ${titleSearch} OR ${descriptionSearch} OR ${tagSearch}
        )
      `;

    const results = await col.query(query);
    res.json(results);
  },
};
