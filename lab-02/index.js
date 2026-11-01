const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();

// Parse incoming JSON request bodies (needed for POST and PUT requests)
app.use(express.json());

const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, "books.db");

let db = null;

/**
 * Task 3: Single async initialization function.
 * Opens the SQLite database connection first.
 * The Express server calls app.listen ONLY after the database connection succeeds.
 * If the connection fails, logs the error and terminates the process with code 1.
 */
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error(`DB Initialization Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// ==========================================
// CRUD Routes
// ==========================================

/**
 * Route 1: GET /books/
 * Description: Retrieve all books from the database.
 * 
 * Viva Concept - Why await?
 * Database queries are asynchronous I/O operations that take time to execute.
 * Using 'await' pauses function execution until the database driver returns
 * the rows, ensuring we do not send an empty or unresolved Promise to the client.
 */
app.get("/books/", async (request, response) => {
  try {
    const getBooksQuery = `
      SELECT *
      FROM book
      ORDER BY id;
    `;
    const booksArray = await db.all(getBooksQuery);
    response.status(200).json(booksArray);
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

/**
 * Route 2: GET /books/:bookId/
 * Description: Retrieve a single book by its ID.
 * 
 * Viva Concept - What is SQL injection and how do ? placeholders prevent it?
 * SQL injection happens when untrusted user input is directly concatenated into
 * a SQL query string, allowing an attacker to inject and execute arbitrary SQL commands.
 * Parameterized queries with '?' placeholders treat user input strictly as literal
 * data, never as executable code, completely neutralizing injection attempts.
 */
app.get("/books/:bookId/", async (request, response) => {
  try {
    const { bookId } = request.params;
    const parsedId = parseInt(bookId, 10);

    // Validate that bookId is a valid number
    if (isNaN(parsedId)) {
      return response.status(400).json({
        error: "Invalid bookId format. bookId must be an integer."
      });
    }

    const getBookQuery = `
      SELECT *
      FROM book
      WHERE id = ?;
    `;
    const book = await db.get(getBookQuery, [parsedId]);

    // Return 404 Not Found if the record does not exist
    if (!book) {
      return response.status(404).json({ error: "Book not found" });
    }

    response.status(200).json(book);
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

/**
 * Route 3: POST /books/
 * Description: Add a new book to the database.
 * Returns HTTP 201 Created along with the newly generated bookId.
 */
app.post("/books/", async (request, response) => {
  try {
    const { title, author, price, pages } = request.body;

    // Validate that all required fields are present
    if (!title || !author || price === undefined || pages === undefined) {
      return response.status(400).json({
        error: "Missing required fields. title, author, price, and pages are required."
      });
    }

    const parsedPrice = parseInt(price, 10);
    const parsedPages = parseInt(pages, 10);

    if (isNaN(parsedPrice) || isNaN(parsedPages)) {
      return response.status(400).json({
        error: "Invalid price or pages. Both must be valid numbers."
      });
    }

    // Use ? placeholders to prevent SQL injection
    const addBookQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `;
    const result = await db.run(addBookQuery, [
      title,
      author,
      parsedPrice,
      parsedPages,
    ]);

    response.status(201).json({
      message: "Book Added Successfully",
      bookId: result.lastID,
    });
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

/**
 * Route 4: PUT /books/:bookId/
 * Description: Update an existing book's details completely.
 * 
 * Viva Concept - When is PUT used instead of POST?
 * - POST is used to CREATE a new resource where the server typically assigns the ID.
 *   POST is NOT idempotent (repeating the call creates multiple duplicate resources).
 * - PUT is used to UPDATE/REPLACE an existing resource identified by its URI (:bookId).
 *   PUT is idempotent (making the identical request 10 times results in the same final state).
 */
app.put("/books/:bookId/", async (request, response) => {
  try {
    const { bookId } = request.params;
    const parsedId = parseInt(bookId, 10);

    if (isNaN(parsedId)) {
      return response.status(400).json({
        error: "Invalid bookId format. bookId must be an integer."
      });
    }

    const { title, author, price, pages } = request.body;

    if (!title || !author || price === undefined || pages === undefined) {
      return response.status(400).json({
        error: "Missing required fields. title, author, price, and pages are required."
      });
    }

    const parsedPrice = parseInt(price, 10);
    const parsedPages = parseInt(pages, 10);

    if (isNaN(parsedPrice) || isNaN(parsedPages)) {
      return response.status(400).json({
        error: "Invalid price or pages. Both must be valid numbers."
      });
    }

    // Check if the book exists before attempting to update
    const checkBookQuery = `SELECT * FROM book WHERE id = ?;`;
    const existingBook = await db.get(checkBookQuery, [parsedId]);

    if (!existingBook) {
      return response.status(404).json({ error: "Book not found" });
    }

    const updateBookQuery = `
      UPDATE book
      SET title = ?, author = ?, price = ?, pages = ?
      WHERE id = ?;
    `;
    await db.run(updateBookQuery, [
      title,
      author,
      parsedPrice,
      parsedPages,
      parsedId,
    ]);

    response.status(200).json({
      message: "Book Updated Successfully"
    });
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

/**
 * Route 5: DELETE /books/:bookId/
 * Description: Remove a book from the database by ID.
 */
app.delete("/books/:bookId/", async (request, response) => {
  try {
    const { bookId } = request.params;
    const parsedId = parseInt(bookId, 10);

    if (isNaN(parsedId)) {
      return response.status(400).json({
        error: "Invalid bookId format. bookId must be an integer."
      });
    }

    // Check if the book exists before attempting to delete
    const checkBookQuery = `SELECT * FROM book WHERE id = ?;`;
    const existingBook = await db.get(checkBookQuery, [parsedId]);

    if (!existingBook) {
      return response.status(404).json({ error: "Book not found" });
    }

    const deleteBookQuery = `
      DELETE FROM book
      WHERE id = ?;
    `;
    await db.run(deleteBookQuery, [parsedId]);

    response.status(200).json({
      message: "Book Deleted Successfully"
    });
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

module.exports = app;

