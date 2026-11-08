CREATE TABLE IF NOT EXISTS book (
    id INTEGER PRIMARY KEY,
    title TEXT,
    author TEXT,
    price INTEGER,
    pages INTEGER
);

INSERT OR IGNORE INTO book (id, title, author, price, pages) VALUES
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

