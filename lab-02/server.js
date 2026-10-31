const express = require('express');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Database connection instance accessible by all routes
let db = null;

// Database file path
const dbPath = path.join(__dirname, 'books.db');

// Port configuration (defaults to 3000, supports platform-assigned port)
const PORT = process.env.PORT || 3000;

/**
 * Initializes the SQLite database connection, ensures table exists,
 * and starts the Express server only after the database connection succeeds.
 */
async function initializeDBAndServer() {
  try {
    // Open connection to SQLite database
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // Ensure the book table exists before accepting any requests
    await db.run(`
      CREATE TABLE IF NOT EXISTS book (
        id INTEGER PRIMARY KEY,
        title TEXT,
        author TEXT,
        price INTEGER,
        pages INTEGER
      );
    `);

    console.log('Database connected successfully.');

    // Start Express server after successful database initialization
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error(`Database initialization error: ${error.message}`);
    // Terminate process if database connection fails
    process.exit(1);
  }
}

// Start database and server initialization
initializeDBAndServer();

// ==========================================
// CRUD ROUTE HANDLERS
// ==========================================

/**
 * Route 1: GET /books/
 * Purpose: Retrieve all books from the database.
 * Status: 200 OK (returns array of books or empty array)
 */
app.get('/books/', async (req, res) => {
  try {
    const getBooksQuery = `SELECT * FROM book ORDER BY id ASC;`;
    const books = await db.all(getBooksQuery);
    res.status(200).json(books);
  } catch (error) {
    console.error('Error fetching books:', error.message);
    res.status(500).json({ error: 'Failed to retrieve books' });
  }
});

/**
 * Route 2: GET /books/:bookId/
 * Purpose: Retrieve a single book by its ID.
 * Status: 200 OK on success, 404 Not Found if missing, 400 Bad Request if invalid ID.
 */
app.get('/books/:bookId/', async (req, res) => {
  try {
    const { bookId } = req.params;
    const parsedId = parseInt(bookId, 10);

    // Validate that bookId is a positive integer
    if (isNaN(parsedId) || parsedId <= 0) {
      return res.status(400).json({ error: 'Invalid book ID. Must be a positive integer.' });
    }

    // Parameterized SQL query using '?' placeholder to prevent SQL injection
    const getBookQuery = `SELECT * FROM book WHERE id = ?;`;
    const book = await db.get(getBookQuery, [parsedId]);

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.status(200).json(book);
  } catch (error) {
    console.error('Error fetching book by ID:', error.message);
    res.status(500).json({ error: 'Failed to retrieve book' });
  }
});

/**
 * Route 3: POST /books/
 * Purpose: Add a new book to the database.
 * Status: 201 Created on success, 400 Bad Request if validation fails.
 */
app.post('/books/', async (req, res) => {
  try {
    const { title, author, price, pages } = req.body;

    // Validate required fields and data types
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required and must be a non-empty string.' });
    }
    if (!author || typeof author !== 'string' || author.trim() === '') {
      return res.status(400).json({ error: 'Author is required and must be a non-empty string.' });
    }
    if (price === undefined || typeof price !== 'number' || price < 0) {
      return res.status(400).json({ error: 'Price is required and must be a non-negative number.' });
    }
    if (pages === undefined || typeof pages !== 'number' || pages <= 0 || !Number.isInteger(pages)) {
      return res.status(400).json({ error: 'Pages is required and must be a positive integer.' });
    }

    // Parameterized SQL query to safely insert book record
    const insertBookQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `;
    const result = await db.run(insertBookQuery, [
      title.trim(),
      author.trim(),
      Math.round(price),
      pages,
    ]);

    // Retrieve the newly created book record using the generated lastID
    const newBookQuery = `SELECT * FROM book WHERE id = ?;`;
    const createdBook = await db.get(newBookQuery, [result.lastID]);

    res.status(201).json(createdBook);
  } catch (error) {
    console.error('Error adding book:', error.message);
    res.status(500).json({ error: 'Failed to add book' });
  }
});

/**
 * Route 4: PUT /books/:bookId/
 * Purpose: Update an existing book's details.
 * Status: 200 OK on success, 404 Not Found if missing, 400 Bad Request if invalid.
 */
app.put('/books/:bookId/', async (req, res) => {
  try {
    const { bookId } = req.params;
    const parsedId = parseInt(bookId, 10);

    // Validate that bookId is a positive integer
    if (isNaN(parsedId) || parsedId <= 0) {
      return res.status(400).json({ error: 'Invalid book ID. Must be a positive integer.' });
    }

    // Check if the book exists before attempting update
    const checkBookQuery = `SELECT * FROM book WHERE id = ?;`;
    const existingBook = await db.get(checkBookQuery, [parsedId]);

    if (!existingBook) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const { title, author, price, pages } = req.body;

    // Validate required fields and data types
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required and must be a non-empty string.' });
    }
    if (!author || typeof author !== 'string' || author.trim() === '') {
      return res.status(400).json({ error: 'Author is required and must be a non-empty string.' });
    }
    if (price === undefined || typeof price !== 'number' || price < 0) {
      return res.status(400).json({ error: 'Price is required and must be a non-negative number.' });
    }
    if (pages === undefined || typeof pages !== 'number' || pages <= 0 || !Number.isInteger(pages)) {
      return res.status(400).json({ error: 'Pages is required and must be a positive integer.' });
    }

    // Parameterized SQL query to safely update book record
    const updateBookQuery = `
      UPDATE book
      SET title = ?, author = ?, price = ?, pages = ?
      WHERE id = ?;
    `;
    await db.run(updateBookQuery, [
      title.trim(),
      author.trim(),
      Math.round(price),
      pages,
      parsedId,
    ]);

    // Fetch and return the updated book record
    const updatedBook = await db.get(checkBookQuery, [parsedId]);

    res.status(200).json(updatedBook);
  } catch (error) {
    console.error('Error updating book:', error.message);
    res.status(500).json({ error: 'Failed to update book' });
  }
});

/**
 * Route 5: DELETE /books/:bookId/
 * Purpose: Delete a book by its ID.
 * Status: 200 OK on success, 404 Not Found if missing, 400 Bad Request if invalid ID.
 */
app.delete('/books/:bookId/', async (req, res) => {
  try {
    const { bookId } = req.params;
    const parsedId = parseInt(bookId, 10);

    // Validate that bookId is a positive integer
    if (isNaN(parsedId) || parsedId <= 0) {
      return res.status(400).json({ error: 'Invalid book ID. Must be a positive integer.' });
    }

    // Check if the book exists before attempting deletion
    const checkBookQuery = `SELECT * FROM book WHERE id = ?;`;
    const existingBook = await db.get(checkBookQuery, [parsedId]);

    if (!existingBook) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Parameterized SQL query to safely delete book record
    const deleteBookQuery = `DELETE FROM book WHERE id = ?;`;
    await db.run(deleteBookQuery, [parsedId]);

    res.status(200).json({
      message: 'Book deleted successfully',
      deletedBook: existingBook,
    });
  } catch (error) {
    console.error('Error deleting book:', error.message);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

module.exports = app;
