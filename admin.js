const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const PORT = 3000;
const ADMIN_LIMIT = 2;

// Middleware
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: '12345',
    resave: false,
    saveUninitialized: true,
}));

// MySQL connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Lahore@123",
    database: "lib-signup",
    port: 4306,
});

db.connect((err) => {
    if (err) {
        console.error("Error connecting to the database:", err);
        process.exit(1);
    }
    console.log("Connected to the database.");

    // Create tables if they don't exist
    const createUsersTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            phone VARCHAR(20) NOT NULL,
            password VARCHAR(255) NOT NULL,
            role ENUM('Librarian', 'Student') NOT NULL,
            image_path VARCHAR(255) NOT NULL
        )
    `;

    const createBooksTableQuery = `
        CREATE TABLE IF NOT EXISTS borrows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    borrower_name VARCHAR(255) NOT NULL,
    borrow_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    fine DECIMAL(10, 2) DEFAULT 0.00,
    CONSTRAINT fk_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    CONSTRAINT chk_fine_non_negative CHECK (fine >= 0)
) ENGINE=InnoDB;
    `;

    const createBorrowsTableQuery = `
 CREATE TABLE IF NOT EXISTS borrows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    borrower_name VARCHAR(255) NOT NULL,
    borrow_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    fine DECIMAL(10, 2) DEFAULT 0.00,
    CONSTRAINT fk_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT chk_fine_non_negative CHECK (fine >= 0)
) ENGINE=InnoDB;

`;

db.query(createBorrowsTableQuery, (err, result) => {
    if (err) {
        console.error('Error creating borrows table:', err);
    } else {
        console.log('Borrows table is ready.');
    }
});
    
    db.query(createUsersTableQuery, (err) => {
        if (err) {
            console.error("Error creating users table:", err);
            process.exit(1);
        }
        console.log("Users table is ready.");
    });

    db.query(createBooksTableQuery, (err) => {
        if (err) {
            console.error("Error creating books table:", err);
            process.exit(1);
        }
        console.log("Books table is ready.");
    });
});




// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = file.mimetype === 'application/pdf' ? 'public/uploads/pdfs' : 'public/uploads';
        cb(null, path.join(__dirname, uploadDir));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ storage });

// Middleware for role-based access control
function checkRole(role) {
    return (req, res, next) => {
        if (!req.session.user || req.session.user.role !== role) {
            return res.status(403).send('Access denied.');
        }
        next();
    };
}

// Middleware for authenticated users
function isAuthenticated(req, res, next) {
    if (req.session && req.session.isAuthenticated && req.session.user) {
        return next();
    }
    res.redirect('/login');
}

// Serve pages
app.get("/signup", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "Signup.html"));
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "Login.html"));
});

app.get("/home", isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "Home.html"));
});
// Serve the home page (for authenticated users only)
app.get("/about", isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "about.html"));
});
// Serve the home page (for authenticated users only)
app.get("/contact", isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "Contact.html"));
});
// Serve the home page (for authenticated users only)
app.get("/history", isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "history.html"));
});
// Serve the home page (for authenticated users only)
app.get("/advance", isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "Advance.html"));
});
app.get('/search', isAuthenticated,(req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'results.html'));
});
app.get('/borrow', isAuthenticated,(req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'borrow.html'));
});


app.get("/dashboard", isAuthenticated, checkRole("Librarian"), (req, res) => {
    res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// Signup route
app.post("/signup", upload.single("insert-img"), async (req, res) => {
    const { username, email, phone, password, role } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    if (!username || !email || !phone || !password || !role || !imagePath) {
        return res.status(400).json({ message: "All fields are required." });
    }

    try {
        if (role === "Librarian") {
            const adminCountQuery = "SELECT COUNT(*) AS count FROM users WHERE role = 'Librarian'";
            const [rows] = await db.promise().query(adminCountQuery);
            const adminCount = rows[0].count;

            if (adminCount >= ADMIN_LIMIT) {
                return res.status(400).json({
                    errorType: "AdminLimitReached",
                    message: `Admin limit of ${ADMIN_LIMIT} has been reached. Please contact the system owner.`,
                });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const insertUserQuery = `
            INSERT INTO users (username, email, phone, password, role, image_path)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await db.promise().query(insertUserQuery, [username, email, phone, hashedPassword, role, imagePath]);

        res.status(201).json({ message: "User registered successfully!" });
    } catch (error) {
        console.error("Error during signup:", error);
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ message: "Username or email already exists." });
        }
        res.status(500).json({ message: "Server error. Please try again later." });
    }
});

// Login route
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "All fields are required." });
    }

    const query = "SELECT * FROM users WHERE username = ?";
    db.query(query, [username], async (err, results) => {
        if (err) {
            console.error("Error querying database:", err);
            return res.status(500).json({ message: "Server error." });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: "Username does not exist." });
        }

        const user = results[0];

        try {
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(401).json({ message: "Incorrect password." });
            }

            req.session.isAuthenticated = true;
            req.session.user = { id: user.id, username: user.username, role: user.role };

            const redirectPage = user.role === "Student" ? "/home" : "/dashboard";
            res.status(200).json({
                message: "Login successful.",
                redirect: redirectPage,
            });
        } catch (error) {
            console.error("Error comparing passwords:", error);
            return res.status(500).json({ message: "Server error." });
        }
    });
});

// Logout route
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).json({ message: "Server error." });
        }
        res.status(200).json({ message: "Logout successful." });
    });
});

// Forgot password route
app.post('/forgot-password', (req, res) => {
    const { username, newPassword } = req.body;

    if (!username || !newPassword) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    const query = "UPDATE users SET password = ? WHERE username = ?";

    db.query(query, [hashedPassword, username], (err, results) => {
        if (err) {
            console.error('Error updating password:', err);
            return res.status(500).json({ message: 'Server error.' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({ message: 'Password updated successfully.' });
    });
});
 //Books API endpoints
app.get('/api/books', (req, res) => {
   db.query('SELECT * FROM books', (err, results) => {
       if (err) throw err;
     res.json(results);
 });
});

app.post('/api/books', upload.fields([{ name: 'image' }, { name: 'pdf' }]), (req, res) => {
    const { title, author, genre, copies, rack, shelf } = req.body;
    const image = req.files.image ? '/uploads/' + req.files.image[0].filename : 'default-book.png';
    const pdf = req.files.pdf ? '/uploads/pdfs/' + req.files.pdf[0].filename : null;

    const query = 'INSERT INTO books (title, author, genre, copies, rack, shelf, image, pdf) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [title, author, genre, copies, rack, shelf, image, pdf], (err) => {
        if (err) {
            console.error('Error adding book:', err);
            return res.status(500).send('Server error.');
        }
        res.send('Book added successfully with PDF.');
    });
});
// Update book details by ID
app.put('/api/books/:id', upload.fields([{ name: 'image' }, { name: 'pdf' }]), (req, res) => {
    const bookId = req.params.id;
    const { title, author, genre, copies, rack, shelf } = req.body;
    const image = req.files.image ? '/uploads/' + req.files.image[0].filename : null;
    const pdf = req.files.pdf ? '/uploads/pdfs/' + req.files.pdf[0].filename : null;

    if (!bookId || isNaN(bookId)) {
        return res.status(400).send('Invalid book ID.');
    }

    const updateQuery = `
        UPDATE books 
        SET 
            title = ?, 
            author = ?, 
            genre = ?, 
            copies = ?, 
            rack = ?, 
            shelf = ?, 
            image = COALESCE(?, image), 
            pdf = COALESCE(?, pdf)
        WHERE id = ?
    `;

    db.query(updateQuery, [title, author, genre, copies, rack, shelf, image, pdf, bookId], (err, results) => {
        if (err) {
            console.error('Error updating book:', err);
            return res.status(500).send('Server error.');
        }

        if (results.affectedRows === 0) {
            return res.status(404).send('Book not found.');
        }

        res.send('Book updated successfully.');
    });
});



// Delete book by ID
app.delete('/api/books/:id', (req, res) => {
    const bookId = req.params.id; // Correctly extracting book ID from the URL parameter

    if (!bookId) {
        return res.status(400).send('Book ID is required.');
    }

    const deleteQuery = 'DELETE FROM books WHERE id = ?'; // Use parameterized queries to prevent SQL injection
    db.query(deleteQuery, [bookId], (err, results) => {
        if (err) {
            console.error('Error deleting book:', err);
            return res.status(500).send('Server error.');
        }

        if (results.affectedRows === 0) {
            return res.status(404).send('Book not found.');
        }

        res.send('Book deleted successfully.');
    });
});


  
  
 
app.get('/api/books/:id', (req, res) => {
    const bookId = req.params.id;

    if (!bookId || isNaN(bookId)) {
        return res.status(400).send('Invalid book ID.');
    }

    db.query('SELECT * FROM books WHERE id = ?', [bookId], (err, results) => {
        if (err) {
            console.error('Error fetching book:', err);
            return res.status(500).send('Error fetching book.');
        }

        if (results.length === 0) {
            return res.status(404).send('Book not found.');
        }

        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Expires', '0');
        res.setHeader('Pragma', 'no-cache');
        res.json(results[0]);
    });
});




/// Borrow a book
app.post('/api/borrow', (req, res) => {
    const { bookId, borrowerName, borrowDate, dueDate } = req.body;

    if (!bookId || !borrowerName || !borrowDate || !dueDate) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    // Check if the student has already borrowed 3 books
    const checkBorrowLimitQuery = `
        SELECT COUNT(*) AS borrowedCount 
        FROM borrows 
        WHERE LOWER(borrower_name) = LOWER(?) AND return_date IS NULL
    `;
    db.query(checkBorrowLimitQuery, [borrowerName], (err, results) => {
        if (err) {
            console.error('Database error while checking borrow limit:', err);
            return res.status(500).json({ error: 'Database error.' });
        }

        const { borrowedCount } = results[0];
        if (borrowedCount >= 3) {
            return res.status(400).json({ error: 'You can only borrow up to 3 books at a time.' });
        }

        // Check if the book is available
        const checkBookAvailabilityQuery = `SELECT copies FROM books WHERE id = ?`;
        db.query(checkBookAvailabilityQuery, [bookId], (err, results) => {
            if (err) {
                console.error('Database error while checking book availability:', err);
                return res.status(500).json({ error: 'Database error.' });
            }

            if (results.length === 0 || results[0].copies < 1) {
                return res.status(400).json({ error: 'Book is not available.' });
            }

            // Insert borrow record
            const borrowQuery = `
                INSERT INTO borrows (book_id, borrower_name, borrow_date, due_date)
                VALUES (?, ?, ?, ?)
            `;
            db.query(borrowQuery, [bookId, borrowerName, borrowDate, dueDate], (err) => {
                if (err) {
                    console.error('Error while inserting borrow record:', err);
                    return res.status(500).json({ error: 'Failed to borrow the book.' });
                }

                // Decrement the number of available copies
                const updateCopiesQuery = `UPDATE books SET copies = copies - 1 WHERE id = ?`;
                db.query(updateCopiesQuery, [bookId], (err) => {
                    if (err) {
                        console.error('Error while updating book copies:', err);
                        return res.status(500).json({ error: 'Failed to update book copies.' });
                    }

                    res.status(200).json({
                        message:
                            'Successfully Borrowed! 😍 You received a confirmation email. Visit the library office to pick up the book.',
                    });
                });
            });
        });
    });
});




// Return a book
// Return a borrowed book
// Return a book
// Return a book based on borrow_id and borrower_name
// Return a book based on borrow_id and borrower_name
// Return a book based on student name and book title
app.post('/api/return', (req, res) => {
    const { borrower_name, book_title, return_date } = req.body;

    if (!borrower_name || !book_title || !return_date) {
        return res.status(400).json({ error: 'Borrower Name, Book Title, and Return Date are required.' });
    }

    const returnDateObj = new Date(return_date);
    if (isNaN(returnDateObj.getTime())) {
        return res.status(400).json({ error: 'Invalid return date.' });
    }

    const fetchBorrowQuery = `
        SELECT b.id AS borrow_id, b.book_id, b.borrow_date, b.due_date, bk.title AS book_title
        FROM borrows b
        JOIN books bk ON b.book_id = bk.id
        WHERE LOWER(b.borrower_name) = LOWER(?) 
          AND LOWER(bk.title) = LOWER(?) 
          AND b.return_date IS NULL
        ORDER BY b.borrow_date DESC
        LIMIT 1
    `;

    db.query(fetchBorrowQuery, [borrower_name, book_title], (err, results) => {
        if (err) {
            console.error('Error fetching borrow details:', err);
            return res.status(500).json({ error: 'Error fetching borrow details.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Borrow record not found or already returned.' });
        }

        const { borrow_id, book_id, due_date } = results[0];
        const dueDateObj = new Date(due_date);

        const fine = calculateFine(dueDateObj, returnDateObj);

        const updateBorrowQuery = `
            UPDATE borrows
            SET return_date = ?, fine = ?
            WHERE id = ?
        `;
        const updateCopiesQuery = `
            UPDATE books
            SET copies = copies + 1
            WHERE id = ?
        `;

        db.query(updateBorrowQuery, [return_date, fine, borrow_id], (err) => {
            if (err) {
                console.error('Error updating borrow record:', err);
                return res.status(500).json({ error: 'Error updating borrow record.' });
            }

            db.query(updateCopiesQuery, [book_id], (err) => {
                if (err) {
                    console.error('Error updating book copies:', err);
                    return res.status(500).json({ error: 'Error updating book copies.' });
                }

                res.status(200).json({
                    fine: `Rs ${fine.toFixed(2)}`,
                    message: `Book returned successfully with Rs ${fine.toFixed(2)} fine.`,
                });
            });
        });
    });
});


// Function to calculate fine based on due date
function calculateFine(dueDate, returnDate) {
    const oneDayMs = 1000 * 60 * 60 * 24; // Milliseconds in a day
    const daysOverdue = Math.max(0, Math.ceil((returnDate - dueDate) / oneDayMs)); // Ensure no negative overdue days
    const finePerDay = 50; // Fine rate: Rs 50 per day
    return daysOverdue * finePerDay;
}





app.get('/api/book-details/:id', (req, res) => {
    const { id } = req.params;

    const query = 'SELECT * FROM books WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error fetching book details:', err);
            return res.status(500).json({ error: 'Error fetching book details' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }

        // Send the book details, including rack and shelf information
        const book = result[0];
        res.json({
            id: book.id,
            title: book.title,
            author: book.author,
            genre: book.genre,
            year: book.year,
            image: book.image,
            rack: book.rack,
            shelf: book.shelf
        });
    });
});
app.get('/api/book-details/:bookId', (req, res) => {
    const bookId = req.params.bookId;
    // Fetch book details from the database
    // Replace this with your actual database query
    const book = getBookFromDatabaseById(bookId); 
    if (book) {
        res.json(book); // Send book details as JSON
    } else {
        res.status(404).json({ message: 'Book not found' });
    }
});


app.get('/api/books', (req, res) => {
    const { page = 1, category = 'all', query = '' } = req.query;
    const limit = 8;
    const offset = (page - 1) * limit;

    let queryCondition = '1 = 1';
    let queryParams = [];

    if (category !== 'all' && query) {
        queryCondition = `${category} LIKE ?`;
        queryParams.push(`%${query}%`);
    }

    const booksQuery = `
        SELECT * FROM books
        WHERE ${queryCondition}
        LIMIT ? OFFSET ?
    `;
    db.query(booksQuery, [...queryParams, limit, offset], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({
            books: results,
            hasPrevious: page > 1,
            hasNext: results.length === limit
        });
    });
});



app.get('/api/borrow-history', (req, res) => {
    const username = req.query.borrower_name;

    // Validate input
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    // SQL query to fetch borrow history for the given username
    const query = `
        SELECT 
            b.id AS borrow_id,
            bk.title AS book_title,
            bk.author,
            b.due_date,
            b.fine,
            bk.image
        FROM 
            borrows b
        JOIN 
            books bk ON b.book_id = bk.id
        WHERE 
            LOWER(b.borrower_name) = ?
    `;

    db.query(query, [username.toLowerCase()], (error, results) => {
        if (error) {
            console.error('Database query error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (!results || results.length === 0) {
            return res.status(404).json({ error: 'No borrow history found for this username' });
        }

        res.json(results);
    });
});




 

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});