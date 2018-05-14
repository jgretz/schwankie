import axios from 'axios';

export default async (req, res) => {
  const response = await axios.get(req.query.url);

  res.json(response.data);
};
