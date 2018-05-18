export default () => app => {
  app.get(process.env.httpChallengeUrl, (req, res) => {
    res.status(200).send(process.env.httpsChallengeData);
  });
};
