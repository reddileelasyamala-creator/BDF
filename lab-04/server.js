const express = require("express");
const path = require("path");
const fs = require("fs");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
let bcrypt;
try {
  bcrypt = require("bcrypt");
} catch (err) {
  try {
    bcrypt = require("bcryptjs");
  } catch (fallbackErr) {
    throw err;
  }
}
const jwt = require("jsonwebtoken");

const app = express();

// Parse JSON request bodies
app.use(express.json());

// Handle malformed JSON syntax errors in request bodies
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: "Malformed JSON payload in request body",
    });
  }
  next(err);
});

// Port configuration
const PORT = process.env.PORT || 3000;

// Ensure database directory exists
const dbDirectory = path.join(__dirname, "database");
if (!fs.existsSync(dbDirectory)) {
  fs.mkdirSync(dbDirectory, { recursive: true });
}

// Database file path based on __dirname for environment-independent execution
const dbPath = process.env.DB_PATH || path.join(dbDirectory, "users.db");

// JWT Secret Key (Configurable via environment variable in production with safe local fallback)
const JWT_SECRET = process.env.JWT_SECRET || "MY_SECRET_TOKEN_KEY_LAB_04";

let db = null;

/**
 * Initialize SQLite database and start the Express HTTP server.
 * The server listens only after the database connection is successfully established.
 */
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // Ensure the users table exists with required schema and constraints
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        password TEXT NOT NULL
      );
    `);

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running at http://localhost:${PORT}/`);
      console.log(`Database connected at: ${dbPath}`);
    });
  } catch (error) {
    console.error(`Database Initialization Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// ==========================================
// Root / Health Check Route
// ==========================================
app.get("/", (request, response) => {
  response.status(200).json({
    message: "Lab 4: Registration, Login and JWT Authentication API",
    student: {
      name: "Reddi Leela Syamala",
      registrationNumber: "252U1R3078",
      section: "CSE(DS)-2B",
      course: "Backend Development Fundamentals",
      labNumber: "04",
    },
    status: "Healthy",
    endpoints: {
      registration: "POST /register/ or POST /register",
      login: "POST /login/ or POST /login",
    },
  });
});

// ==========================================
// User Registration Route
// POST /register/ or POST /register
// ==========================================
const handleRegister = async (request, response) => {
  try {
    const { username, name, password } = request.body;

    // 1. Validation: check presence of required fields
    if (!username || !name || !password) {
      return response.status(400).json({
        error: "Username, name, and password are required",
      });
    }

    // Validate string types and trim
    const trimmedUsername = String(username).trim();
    const trimmedName = String(name).trim();
    const rawPassword = String(password);

    if (trimmedUsername === "" || trimmedName === "" || rawPassword === "") {
      return response.status(400).json({
        error: "Fields cannot be empty or whitespace only",
      });
    }

    // 2. Check whether the username already exists
    const selectUserQuery = "SELECT * FROM users WHERE username = ?;";
    const existingUser = await db.get(selectUserQuery, [trimmedUsername]);

    if (existingUser !== undefined) {
      return response.status(400).json({
        error: "Username already exists",
      });
    }

    // 3. Hash the password using bcrypt with 10 salt rounds
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(rawPassword, saltRounds);

    // 4. Insert user record into SQLite database using parameterized query
    const insertUserQuery = `
      INSERT INTO users (username, name, password)
      VALUES (?, ?, ?);
    `;
    await db.run(insertUserQuery, [trimmedUsername, trimmedName, hashedPassword]);

    // 5. Return success response (never expose password or password hash)
    return response.status(201).json({
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Error in registration:", error.message);
    return response.status(500).json({
      error: "Internal server error",
    });
  }
};

app.post("/register", handleRegister);
app.post("/register/", handleRegister);

// ==========================================
// User Login Route
// POST /login/ or POST /login
// ==========================================
const handleLogin = async (request, response) => {
  try {
    const { username, password } = request.body;

    // 1. Validation: check presence of required fields
    if (!username || !password) {
      return response.status(400).json({
        error: "Username and password are required",
      });
    }

    const trimmedUsername = String(username).trim();
    const rawPassword = String(password);

    if (trimmedUsername === "" || rawPassword === "") {
      return response.status(400).json({
        error: "Username and password cannot be empty",
      });
    }

    // 2. Find user by username
    const selectUserQuery = "SELECT * FROM users WHERE username = ?;";
    const dbUser = await db.get(selectUserQuery, [trimmedUsername]);

    if (dbUser === undefined) {
      return response.status(400).json({
        error: "Invalid user",
      });
    }

    // 3. Compare supplied password with stored bcrypt hash
    const isPasswordMatched = await bcrypt.compare(rawPassword, dbUser.password);

    if (!isPasswordMatched) {
      return response.status(400).json({
        error: "Invalid password",
      });
    }

    // 4. Generate JWT with payload containing ONLY username
    const payload = {
      username: dbUser.username,
    };

    const jwtToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: "1h",
    });

    // 5. Return JWT token
    return response.status(200).json({
      jwt_token: jwtToken,
    });
  } catch (error) {
    console.error("Error in login:", error.message);
    return response.status(500).json({
      error: "Internal server error",
    });
  }
};

app.post("/login", handleLogin);
app.post("/login/", handleLogin);

module.exports = app;
