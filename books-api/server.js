const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'db.json');

app.use(bodyParser.json());


const readDB = () => {
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data);
};

const writeDB = (data) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};


app.post('/books', (req, res) => {
  const { title, author, year } = req.body;

  if (!title || !author || !year) {
    return res.status(400).json({ error: "Title, author, and year are required" });
  }

  try {
    const db = readDB();
    const newId = db.books.length ? db.books[db.books.length - 1].id + 1 : 1;

    const newBook = { id: newId, title, author, year };
    db.books.push(newBook);
    writeDB(db);

    res.status(201).json(newBook);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});


app.get('/books', (req, res) => {
  try {
    const db = readDB();
    res.status(200).json(db.books);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});


app.get('/books/:id', (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const db = readDB();
    const book = db.books.find(b => b.id === id);
    if (!book) return res.status(404).json({ error: "Book not found" });

    res.status(200).json(book);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});


app.put('/books/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { title, author, year } = req.body;

  if (!title && !author && !year) {
    return res.status(400).json({ error: "At least one of title, author, or year is required to update" });
  }

  try {
    const db = readDB();
    const index = db.books.findIndex(b => b.id === id);
    if (index === -1) return res.status(404).json({ error: "Book not found" });

    if (title) db.books[index].title = title;
    if (author) db.books[index].author = author;
    if (year) db.books[index].year = year;

    writeDB(db);
    res.status(200).json(db.books[index]);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete('/books/:id', (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const db = readDB();
    const index = db.books.findIndex(b => b.id === id);
    if (index === -1) return res.status(404).json({ error: "Book not found" });

    db.books.splice(index, 1);
    writeDB(db);

    res.status(200).json({ message: `Book with id ${id} deleted` });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});


app.get('/books/search', (req, res) => {
  const { author, title } = req.query;

  if (!author && !title) {
    return res.status(400).json({ error: "At least one query parameter ('author' or 'title') is required" });
  }

  try {
    const db = readDB();

    const results = db.books.filter(book => {
      const matchAuthor = author
        ? book.author.toLowerCase().includes(author.toLowerCase())
        : true;
      const matchTitle = title
        ? book.title.toLowerCase().includes(title.toLowerCase())
        : true;

      return matchAuthor && matchTitle;
    });

    if (results.length === 0) {
      return res.status(404).json({ message: "No books found" });
    }

    res.status(200).json(results);
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});


app.use((req, res) => {
  res.status(404).json({ error: "404 Not Found" });
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
