const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
mongoose.connect("mongodb://localhost:27017/book_recommendations", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Book Schema
const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  genre: [String],
  price: Number,
  image: String,
  rating: Number,
});

const Book = mongoose.model('Book', bookSchema, 'books');

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', connected: mongoose.connection.readyState === 1 });
});

// Endpoint 1: Get books by genre
app.get('/books/genre', async (req, res) => {
  const genre = req.query.genre ? req.query.genre.trim() : '';
  if (!genre) return res.status(400).json({ error: 'Genre is required' });

  try {
    const books = await Book.find({ genre: { $regex: new RegExp(genre, 'i') } })
      .sort({ rating: -1 })
      .limit(5)
      .select('title author genre price image rating');
    res.json(books);
  } catch (error) {
    console.error('Error fetching books by genre:', error);
    res.status(500).json({ error: 'Error fetching books by genre' });
  }
});

// Endpoint 2: Get books by author
app.get('/books/author', async (req, res) => {
  const author = req.query.author ? req.query.author.trim() : '';
  if (!author) return res.status(400).json({ error: 'Author is required' });

  try {
    const books = await Book.find({ author: { $regex: new RegExp(author, 'i') } })
      .sort({ rating: -1 })
      .limit(5)
      .select('title author genre price image rating');
    res.json(books);
  } catch (error) {
    console.error('Error fetching books by author:', error);
    res.status(500).json({ error: 'Error fetching books by author' });
  }
});

// Endpoint 3: Get similar books (by overlapping genres)
app.get('/books/similar', async (req, res) => {
  const title = req.query.title ? req.query.title.trim() : '';
  if (!title) return res.status(400).json({ error: 'Book title is required' });

  try {
    const book = await Book.findOne({ title: { $regex: new RegExp(title, 'i') } });
    if (!book) return res.status(404).json({ error: 'Book not found' });

    const similarBooks = await Book.find({
      _id: { $ne: book._id },
      genre: { $in: book.genre }
    })
      .sort({ rating: -1 })
      .limit(5)
      .select('title author genre price image rating');

    res.json(similarBooks);
  } catch (error) {
    console.error('Error fetching similar books:', error);
    res.status(500).json({ error: 'Error fetching similar books' });
  }
});

// Endpoint 4: Get all books
app.get('/books', async (req, res) => {
  try {
    const books = await Book.find()
      .sort({ rating: -1 })
      .limit(10)
      .select('title author genre price image rating');
    res.json(books);
  } catch (error) {
    console.error('Error fetching all books:', error);
    res.status(500).json({ error: 'Error fetching books' });
  }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
