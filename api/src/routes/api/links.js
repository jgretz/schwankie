import _ from 'lodash';
import {findById, findByUrl, findBySearch} from '../../strategies';

const strategies = [findById, findByUrl, findBySearch];

export default class Links {
  async get(req, res) {
    const strategy = _.find(strategies, s => s.test(req));
    if (!strategy) {
      res.json([]);
      return;
    }

    const col = req.cosmos.links;

    try {
      await strategy.find(req, res, col);
    } catch (err) {
      res.status(500).send(err);
    }
  }

  async post(req, res) {
    const col = req.cosmos.links;

    try {
      const result = await col.create(req.body);
      res.json(result);
    } catch (err) {
      res.status(500).send(err);
    }
  }

  async put(req, res) {
    const col = req.cosmos.links;

    try {
      const result = await col.replace(req.body.id, req.body);
      res.json(result);
    } catch (err) {
      res.status(500).send(err);
    }
  }

  async delete(req, res) {
    const col = req.cosmos.links;

    try {
      const result = await col.delete(req.query.id);
      res.json(result);
    } catch (err) {
      res.status(500).send(err);
    }
  }
}
