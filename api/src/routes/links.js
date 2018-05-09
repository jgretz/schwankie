
export default class Links {
  async get(req, res) {
    const col = req.cosmos.links;

    if (req.query.id) {
      const result = await col.getById(req.query.id);
      res.json(result);

      return;
    }

    if (req.query.search) {
      const terms = req.query.search.split(',');
      if (terms.length === 0) {
        res.json([]);
        return;
      }

      const titleSearch = terms.map(t => `CONTAINS(l.title, "${t}")`).join(' OR ');
      const descriptionSearch = terms.map(t => `CONTAINS(l.description, "${t}")`).join(' OR ');
      const tagSearch = terms.map(t => `ARRAY_CONTAINS(l.tags, "${t}")`).join(' OR ');

      const query = `
        SELECT l.url, l.title, l.description, l.tags
        FROM links l
        WHERE (
          ${titleSearch} OR ${descriptionSearch} OR ${tagSearch}
        )
      `;

      const results = await col.query(query);
      res.json(results);

      return;
    }

    res.json([]);
  }

  async post(req, res) {
    const col = req.cosmos.links;

    const result = await col.create(req.body);
    res.json(result);
  }

  async put(req, res) {
    const col = req.cosmos.links;

    const result = await col.replace(req.body.id, req.body);
    res.json(result);
  }

  async delete(req, res) {
    const col = req.cosmos.links;

    const result = await col.delete(req.query.id);
    res.json(result);
  }
}
