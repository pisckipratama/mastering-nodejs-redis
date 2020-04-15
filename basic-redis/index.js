'use strict';

const express = require('express');
const redis = require('redis');
const request = require('superagent');
const app = express();
const client = redis.createClient();

const respond = (username, respositories) => {
  return `User "${username}" has ${respositories} public repositories.`;
};

const getUserRepos = (req, res) => {
  let username = req.query.username;
  request.get(`https://api.github.com/users/${username}`).set('User-Agent', 'node.js').end(function (err, response) {
    if (err) throw err;
    let repoLength = response.body.public_repos;
    client.setex(username, 3600, repoLength);
    res.send(respond(username, repoLength));
  });
};

function cache(req, res, next) {
  const username = req.query.username;
  client.get(username, (err, data) => {
    if (err) throw err;
    if (data != null) {
      res.send(respond(username, data));
    } else {
      next();
    }
  })
}

app.get('/users', cache, getUserRepos);

app.listen(3000, () => console.log('server running at http://localhost:3000'));