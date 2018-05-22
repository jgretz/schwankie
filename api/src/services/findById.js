export default {
  test: req => req.query.id,
  find: async (req, res, col) => {
    const result = await col.getById(req.query.id);
    res.json(result);
  },
};
