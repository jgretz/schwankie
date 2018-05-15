import _ from 'lodash';
import {logError} from 'node-bits';
import {findById, findRecent, findByUrl, findBySearch} from '../../strategies';

const strategies = [findById, findRecent, findByUrl, findBySearch];

export default class Links {
  handleError(res, err) {
    logError(JSON.stringify(err));

    res.status(500).send(err);
  }

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
      this.handleError(res, err);
    }
  }

  async post(req, res) {
    const col = req.cosmos.links;

    try {
      const result = await col.create(req.body);
      res.json(result);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async put(req, res) {
    const col = req.cosmos.links;

    try {
      const result = await col.replace(req.body.id, req.body);
      res.json(result);
    } catch (err) {
      this.handleError(res, err);
    }
  }

  async delete(req, res) {
    const col = req.cosmos.links;

    try {
      const result = await col.delete(req.query.id);
      res.json(result);
    } catch (err) {
      this.handleError(res, err);
    }
  }
}
