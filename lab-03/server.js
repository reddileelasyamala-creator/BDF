const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();

// Parse JSON request bodies
app.use(express.json());

// Handle malformed JSON in request bodies
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: true,
      message: "Malformed JSON payload in request body"
    });
  }
  next(err);
});

const PORT = process.env.PORT || 3000;
const dbPath = process.env.DB_PATH || path.join(__dirname, "books.db");

let db = null;

/**
 * Initialize SQLite Database connection and start Express HTTP server.
 * The server listens only after the database connection is successfully established.
 */
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // Ensure the table exists
    await db.run(`
      CREATE TABLE IF NOT EXISTS book (
        id INTEGER PRIMARY KEY,
        title TEXT,
        author TEXT,
        price INTEGER,
        pages INTEGER
      );
    `);

    // Auto-seed initial 10 books if table is empty (ensures persistence on ephemeral deployments)
    const bookCountRow = await db.get("SELECT COUNT(*) AS count FROM book;");
    if (bookCountRow && bookCountRow.count === 0) {
      await db.run(`
        INSERT INTO book (id, title, author, price, pages) VALUES
          (1, 'To Kill a Mockingbird', 'Harper Lee', 350, 281),
          (2, '1984', 'George Orwell', 299, 328),
          (3, 'The Great Gatsby', 'F. Scott Fitzgerald', 250, 180),
          (4, 'Pride and Prejudice', 'Jane Austen', 320, 279),
          (5, 'The Catcher in the Rye', 'J.D. Salinger', 399, 234),
          (6, 'The Hobbit', 'J.R.R. Tolkien', 450, 310),
          (7, 'Fahrenheit 451', 'Ray Bradbury', 280, 256),
          (8, 'Jane Eyre', 'Charlotte Bronte', 310, 500),
          (9, 'Clean Code', 'Robert C. Martin', 750, 464),
          (10, 'The Pragmatic Programmer', 'Andrew Hunt and David Thomas', 620, 352);
      `);
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running at http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error(`DB Initialization Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// ============================================================================
// Root & Health Check Endpoints
// ============================================================================

app.get("/", (request, response) => {
  response.status(200).json({
    message: "Welcome to Book Management RESTful API",
    version: "1.0.0",
    student: {
      name: "Reddi Leela Syamala",
      regNo: "252U1R3078",
      section: "CSE(DS)-2B",
      lab: "03"
    },
    documentation: "/books/ supports search_q, order_by, order, limit, offset, min_price, max_price"
  });
});

app.get("/health/", (request, response) => {
  response.status(200).json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// RESTful API Endpoints
// ============================================================================

/**
 * Endpoint 1: GET /books/
 * Supports Query Parameters:
 *  - search_q: Search in title and author
 *  - order_by: Column to sort by (title, price, pages, id)
 *  - order: Sort direction (ASC, DESC)
 *  - limit: Maximum number of records to return
 *  - offset: Number of records to skip
 *  - min_price: Minimum price filter (price >= min_price)
 *  - max_price: Maximum price filter (price <= max_price)
 */
app.get("/books/", async (request, response) => {
  try {
    const {
      search_q,
      order_by,
      order,
      limit,
      offset,
      min_price,
      max_price
    } = request.query;

    // Allowed columns for sorting whitelist (prevents SQL injection on ORDER BY)
    const allowedSortColumns = ["id", "title", "price", "pages"];
    let sortColumn = "id";
    if (order_by !== undefined) {
      const lowerOrderBy = order_by.toLowerCase().trim();
      if (!allowedSortColumns.includes(lowerOrderBy)) {
        return response.status(400).json({
          error: true,
          message: `Invalid order_by field: '${order_by}'. Allowed fields are: id, title, price, pages`
        });
      }
      sortColumn = lowerOrderBy;
    }

    // Allowed sort directions whitelist
    let sortDirection = "ASC";
    if (order !== undefined) {
      const upperOrder = order.toUpperCase().trim();
      if (upperOrder !== "ASC" && upperOrder !== "DESC") {
        return response.status(400).json({
          error: true,
          message: `Invalid order direction: '${order}'. Allowed values are: ASC, DESC`
        });
      }
      sortDirection = upperOrder;
    }

    // Validate limit
    let parsedLimit = null;
    if (limit !== undefined) {
      const numLimit = Number(limit);
      if (!Number.isInteger(numLimit) || numLimit <= 0) {
        return response.status(400).json({
          error: true,
          message: "Invalid limit value. Limit must be a positive integer"
        });
      }
      parsedLimit = numLimit;
    }

    // Validate offset
    let parsedOffset = null;
    if (offset !== undefined) {
      const numOffset = Number(offset);
      if (!Number.isInteger(numOffset) || numOffset < 0) {
        return response.status(400).json({
          error: true,
          message: "Invalid offset value. Offset must be a non-negative integer"
        });
      }
      parsedOffset = numOffset;
    }

    // Validate min_price
    let parsedMinPrice = null;
    if (min_price !== undefined) {
      const numMin = Number(min_price);
      if (isNaN(numMin) || numMin < 0) {
        return response.status(400).json({
          error: true,
          message: "Invalid min_price value. min_price must be a non-negative number"
        });
      }
      parsedMinPrice = numMin;
    }

    // Validate max_price
    let parsedMaxPrice = null;
    if (max_price !== undefined) {
      const numMax = Number(max_price);
      if (isNaN(numMax) || numMax < 0) {
        return response.status(400).json({
          error: true,
          message: "Invalid max_price value. max_price must be a non-negative number"
        });
      }
      parsedMaxPrice = numMax;
    }

    // Cross-validate min_price and max_price
    if (parsedMinPrice !== null && parsedMaxPrice !== null && parsedMinPrice > parsedMaxPrice) {
      return response.status(400).json({
        error: true,
        message: "min_price cannot be greater than max_price"
      });
    }

    // Construct SQL Query dynamically using parameterized clauses
    const whereConditions = [];
    const queryParams = [];

    if (search_q !== undefined && search_q.trim() !== "") {
      whereConditions.push("(title LIKE ? OR author LIKE ?)");
      const searchPattern = `%${search_q.trim()}%`;
      queryParams.push(searchPattern, searchPattern);
    }

    if (parsedMinPrice !== null) {
      whereConditions.push("price >= ?");
      queryParams.push(parsedMinPrice);
    }

    if (parsedMaxPrice !== null) {
      whereConditions.push("price <= ?");
      queryParams.push(parsedMaxPrice);
    }

    let selectBooksQuery = "SELECT * FROM book";
    if (whereConditions.length > 0) {
      selectBooksQuery += " WHERE " + whereConditions.join(" AND ");
    }

    // Safe to interpolate validated column and direction from whitelist
    selectBooksQuery += ` ORDER BY ${sortColumn} ${sortDirection}`;

    // Add pagination
    if (parsedLimit !== null) {
      selectBooksQuery += " LIMIT ?";
      queryParams.push(parsedLimit);
      if (parsedOffset !== null) {
        selectBooksQuery += " OFFSET ?";
        queryParams.push(parsedOffset);
      }
    } else if (parsedOffset !== null) {
      // In SQLite, OFFSET requires a LIMIT. Using -1 represents no upper limit.
      selectBooksQuery += " LIMIT -1 OFFSET ?";
      queryParams.push(parsedOffset);
    }

    selectBooksQuery += ";";

    const books = await db.all(selectBooksQuery, queryParams);
    response.status(200).json(books);
  } catch (error) {
    console.error("GET /books/ error:", error.message);
    response.status(500).json({
      error: true,
      message: "Internal server error"
    });
  }
});

/**
 * Endpoint 2: GET /books/:bookId/
 * Retrieve a specific book by its ID.
 */
app.get("/books/:bookId/", async (request, response) => {
  try {
    const { bookId } = request.params;
    const parsedId = Number(bookId);

    // Validate ID: must be a positive integer
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return response.status(400).json({
        error: true,
        message: "Invalid book ID. ID must be a positive integer"
      });
    }

    const getBookQuery = "SELECT * FROM book WHERE id = ?;";
    const book = await db.get(getBookQuery, [parsedId]);

    if (!book) {
      return response.status(404).json({
        error: true,
        message: "Book not found"
      });
    }

    response.status(200).json(book);
  } catch (error) {
    console.error("GET /books/:bookId/ error:", error.message);
    response.status(500).json({
      error: true,
      message: "Internal server error"
    });
  }
});

/**
 * Endpoint 3: POST /books/
 * Create a new book record with validation.
 */
app.post("/books/", async (request, response) => {
  try {
    const body = request.body;

    if (!body || typeof body !== "object" || Object.keys(body).length === 0) {
      return response.status(400).json({
        error: true,
        message: "Request body cannot be empty"
      });
    }

    const { title, author, price, pages } = body;

    // Validate title
    if (title === undefined || typeof title !== "string" || title.trim() === "") {
      return response.status(400).json({
        error: true,
        message: "Missing or invalid title. Title must be a non-empty string"
      });
    }

    // Validate author
    if (author === undefined || typeof author !== "string" || author.trim() === "") {
      return response.status(400).json({
        error: true,
        message: "Missing or invalid author. Author must be a non-empty string"
      });
    }

    // Validate price
    const numPrice = Number(price);
    if (price === undefined || isNaN(numPrice) || numPrice <= 0) {
      return response.status(400).json({
        error: true,
        message: "Invalid price value. Price must be a positive number"
      });
    }

    // Validate pages
    const numPages = Number(pages);
    if (pages === undefined || !Number.isInteger(numPages) || numPages <= 0) {
      return response.status(400).json({
        error: true,
        message: "Invalid pages value. Pages must be a positive integer"
      });
    }

    // Insert new book with parameterized query
    const insertBookQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `;
    const result = await db.run(insertBookQuery, [
      title.trim(),
      author.trim(),
      numPrice,
      numPages
    ]);

    response.status(201).json({
      message: "Book Added Successfully",
      bookId: result.lastID
    });
  } catch (error) {
    console.error("POST /books/ error:", error.message);
    response.status(500).json({
      error: true,
      message: "Internal server error"
    });
  }
});

/**
 * Endpoint 4: PUT /books/:bookId/
 * Update an existing book record.
 */
app.put("/books/:bookId/", async (request, response) => {
  try {
    const { bookId } = request.params;
    const parsedId = Number(bookId);

    // Validate ID
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return response.status(400).json({
        error: true,
        message: "Invalid book ID. ID must be a positive integer"
      });
    }

    const body = request.body;
    if (!body || typeof body !== "object" || Object.keys(body).length === 0) {
      return response.status(400).json({
        error: true,
        message: "Request body cannot be empty"
      });
    }

    const { title, author, price, pages } = body;

    // Validate title
    if (title === undefined || typeof title !== "string" || title.trim() === "") {
      return response.status(400).json({
        error: true,
        message: "Missing or invalid title. Title must be a non-empty string"
      });
    }

    // Validate author
    if (author === undefined || typeof author !== "string" || author.trim() === "") {
      return response.status(400).json({
        error: true,
        message: "Missing or invalid author. Author must be a non-empty string"
      });
    }

    // Validate price
    const numPrice = Number(price);
    if (price === undefined || isNaN(numPrice) || numPrice <= 0) {
      return response.status(400).json({
        error: true,
        message: "Invalid price value. Price must be a positive number"
      });
    }

    // Validate pages
    const numPages = Number(pages);
    if (pages === undefined || !Number.isInteger(numPages) || numPages <= 0) {
      return response.status(400).json({
        error: true,
        message: "Invalid pages value. Pages must be a positive integer"
      });
    }

    // Check if book exists
    const checkQuery = "SELECT * FROM book WHERE id = ?;";
    const existingBook = await db.get(checkQuery, [parsedId]);

    if (!existingBook) {
      return response.status(404).json({
        error: true,
        message: "Book not found"
      });
    }

    // Update book with parameterized query
    const updateBookQuery = `
      UPDATE book
      SET title = ?, author = ?, price = ?, pages = ?
      WHERE id = ?;
    `;
    await db.run(updateBookQuery, [
      title.trim(),
      author.trim(),
      numPrice,
      numPages,
      parsedId
    ]);

    response.status(200).json({
      message: "Book Updated Successfully"
    });
  } catch (error) {
    console.error("PUT /books/:bookId/ error:", error.message);
    response.status(500).json({
      error: true,
      message: "Internal server error"
    });
  }
});

/**
 * Endpoint 5: DELETE /books/:bookId/
 * Remove a book by its ID.
 */
app.delete("/books/:bookId/", async (request, response) => {
  try {
    const { bookId } = request.params;
    const parsedId = Number(bookId);

    // Validate ID
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return response.status(400).json({
        error: true,
        message: "Invalid book ID. ID must be a positive integer"
      });
    }

    // Check if book exists
    const checkQuery = "SELECT * FROM book WHERE id = ?;";
    const existingBook = await db.get(checkQuery, [parsedId]);

    if (!existingBook) {
      return response.status(404).json({
        error: true,
        message: "Book not found"
      });
    }

    const deleteBookQuery = "DELETE FROM book WHERE id = ?;";
    await db.run(deleteBookQuery, [parsedId]);

    response.status(200).json({
      message: "Book Deleted Successfully"
    });
  } catch (error) {
    console.error("DELETE /books/:bookId/ error:", error.message);
    response.status(500).json({
      error: true,
      message: "Internal server error"
    });
  }
});

// ============================================================================
// Catch-all 404 & Global 500 Middleware
// ============================================================================

app.use((request, response) => {
  response.status(404).json({
    error: true,
    message: "Endpoint not found"
  });
});

app.use((error, request, response, next) => {
  console.error("Unhandled Global Error:", error.message);
  response.status(500).json({
    error: true,
    message: "Internal server error"
  });
});

module.exports = app;
