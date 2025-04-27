const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Connect to local MongoDB with error handling
mongoose.connect('mongodb://localhost:27017/book_recommendations', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define Book Schema
const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  genres: [String],
  keywords: [String],
  rating: Number,
});

const Book = mongoose.model('Book', bookSchema);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', connected: mongoose.connection.readyState === 1 });
});

// Endpoint 1: Get books by genre
app.get('/books/genre', async (req, res) => {
  const genre = req.query.genre ? req.query.genre.trim().replace(/\s+/g, '-') : '';
  if (!genre) return res.status(400).json({ error: 'Genre is required' });

  try {
    const books = await Book.aggregate([
      { $match: { genres: { $elemMatch: { $regex: new RegExp(genre.replace('-', '( |-)?'), 'i') } } } },
      { $project: { title: 1, author: 1, genres: 1, rating: 1 } },
      { $sort: { rating: -1 } },
      { $limit: 5 },
    ]);
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching books by genre' });
  }
});

// Endpoint 2: Get books by author
app.get('/books/author', async (req, res) => {
  const author = req.query.author ? req.query.author.trim() : '';
  if (!author) return res.status(400).json({ error: 'Author is required' });

  try {
    const books = await Book.aggregate([
      { $match: { author: { $regex: new RegExp(author, 'i') } } },
      { $project: { title: 1, author: 1, genres: 1, rating: 1 } },
      { $sort: { rating: -1 } },
      { $limit: 5 },
    ]);
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching books by author' });
  }
});

// Endpoint 3: Get similar books
app.get('/books/similar', async (req, res) => {
  const title = req.query.title ? req.query.title.trim() : '';
  if (!title) return res.status(400).json({ error: 'Book title is required' });

  try {
    const book = await Book.findOne({ title: { $regex: new RegExp(title, 'i') } });
    if (!book) return res.status(404).json({ error: 'Book not found' });

    const similarBooks = await Book.aggregate([
      { $match: { 
        _id: { $ne: book._id },
        $expr: { $gt: [{ $setIntersection: ["$genres", book.genres] }, []] }
      }},
      { $project: {
        title: 1,
        author: 1,
        genres: 1,
        rating: 1,
        similarity: { $size: { $setIntersection: ["$keywords", book.keywords] } }
      }},
      { $sort: { similarity: -1, rating: -1 } },
      { $limit: 5 },
    ]);
    res.json(similarBooks);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching similar books' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});