'use strict';

const restify = require('restify');
const fetch = require('node-fetch');
const errors = require('restify-errors');
const redis = require('redis');

const PORT = process.env.PORT || 3002;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const client = redis.createClient(REDIS_PORT);
const server = restify.createServer({
  name: "Learn MemCached using Restify and Redis"
});

// set response 
const respond = (user, repos) => {
  return `username ${user} has ${repos} public repos.`;
};

// make request
const getRepos = async (req, res, next) => {
  try {
    console.log('fetching data...');
    const { username } = req.params;
    const response = await fetch(`https://api.github.com/users/${username}`);
    const data = await response.json();
    const repos = data.public_repos || 0;

    // client set data to redis
    client.setex(username, 3600, repos);
    res.send(respond(username, repos));
    next();

  } catch (err) {
    console.error(err);
    next(new errors.InvalidContentError(err));
  }
};

// cached middleware
const caches = (req, res, next) => {
  const { username } = req.params;
  client.get(username, (err, data) => {
    if (err) return next(new errors.InvalidContentError(err));

    if (data !== null) {
      res.send(respond(username, data));
    } else {
      next();
    };
  });
};

server.get('/api', (req, res, next) => {
  res.send(200, { msg: "Hello" });
  next();
});

server.get('/repos/:username', caches, getRepos);

server.listen(PORT, () => console.log(`Server running at port ${PORT}`));