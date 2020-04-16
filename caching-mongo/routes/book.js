const express = require('express');
const router = express.Router();
const redis = require('redis');

const Book = require('../models/Book');

const REDIS_PORT = process.env.REDIS_PORT || 6379;

const client = redis.createClient(REDIS_PORT);

// cache middleware
const caches = (req, res, next) => {
  const { title } = req.params;
  client.get(title, (err, data) => {
    if (err) throw err;

    if (data !== null) {
      res.json(JSON.parse(data));
    } else {
      next();
    }
  })
}

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET All Data */
router.get('/book/:title', caches, async (req, res, next) => {
  try {
    const { title } = req.params
    console.log(`fetching data ${title}`);
    const bookList = await Book.findOne({ title });
    client.setex(title, 3600, JSON.stringify(bookList));

    res.status(200).json(bookList);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  };
});

router.post('/book', async (req, res, next) => {
  const { title, author, text } = req.body;

  try {
    const newBook = new Book({ title, author, text });
    const saveBook = await newBook.save();
    res.status(201).json(saveBook);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

module.exports = router;
