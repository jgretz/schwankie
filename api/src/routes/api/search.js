import axios from 'axios';
import {logError} from 'node-bits';

export default async (req, res) => {
  try {
    const response = await axios.get(req.query.url);
    res.json(response.data);
  } catch (err) {
    logError(JSON.stringify(err));
    res.status(500).send(err);
  }
};
