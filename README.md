# Backend Development Fundamentals - Lab Reports

Comprehensive laboratory experiments, implementations, and documentation for the **Backend Development Fundamentals** course.

---

## Student Information

- **Student Name:** Reddi Leela Syamala
- **Registration Number:** [Registration Number]
- **Branch / Section:** CSE(DS)-2B
- **Institution:** Aurora
- **Course:** Backend Development Fundamentals (Year II Term II)
- **Faculty:** Joel Prashanth D
- **GitHub Repository:** [Lab-1](https://github.com/reddileelasyamala-creator/Lab-1)

---

## Lab Directory Index

| Lab | Title | Description | Technologies | Report Link |
| :---: | :--- | :--- | :--- | :---: |
| **Lab 01** | **Node.js and Express Server** | Introduction to backend servers using Node.js built-in `http` module and Express.js routing, status codes, and error handling. | Node.js, Express.js | [View Lab 01](./lab-01/) |

---

## Repository Structure

```plaintext
Backend_development_fundamentals_lab/
├── .gitignore
├── README.md
└── lab-01/
    ├── .gitignore
    ├── package.json
    ├── package-lock.json
    ├── README.md
    ├── server-http.js         # Built-in Node http server
    ├── server.js              # Express application server
    └── screenshots/           # Endpoint response screenshots
        ├── home.png
        ├── about.png
        ├── time.png
        └── not-found.png
```

---

## General Setup & Installation

Each lab experiment is self-contained within its respective directory. To set up and run Lab 01:

1. **Navigate into the lab directory:**
   ```bash
   cd lab-01
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the server:**
   - **For Express server:**
     ```bash
     npm start        # Starts Express server
     # or: node server.js
     ```
   - **For Basic HTTP server:**
     ```bash
     npm run start:http
     # or: node server-http.js
     ```

Refer to the individual [`README.md`](./lab-01/README.md) file in the `lab-01` directory for full experiment details, API endpoint specifications, review questions, and screenshots.
