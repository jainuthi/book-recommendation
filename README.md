# Book recommendation Engine
A Recommendation System for books using MongoDB aggregations framework that filters books based on features like genres, author, price, rating etc.
---
## Features
- Recommend books to users based on book title, genre, rating, price, author name etc.

- MongoDB Aggregation Framework for querying and filtering
---
## Tech stack
- Frontend: HTML, CSS, Vanilla JS

- Backend: Node.js,Express.js

- Database: MongoDB (compass)
---
## Schema 
- ```
  const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  genre: [String],
  price: Number,
  image: String,
  rating: Number,});
  ```
