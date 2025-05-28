// routes/faculty.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
require("dotenv").config();

const router = express.Router();

// Faculty login route
router.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    // Check if the faculty exists
    db.query("SELECT * FROM faculty WHERE email = ?", [email], async (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Database error", error: err });
        }
        if (results.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const faculty = results[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, faculty.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Create JWT
        const token = jwt.sign({ id: faculty.id, email: faculty.email,name: faculty.name, }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({
            message: "Login successful",
            token,
            facultyName: faculty.name,
        });
    });
});

// Middleware to verify faculty auth
function verifyFacultyToken(req, res, next) {
    const token = req.headers["authorization"];
    if (!token) {
        return res.status(403).json({ message: "Unauthorized access" });
    }
    try {
        const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
        req.faculty = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
}

router.get("/verify", verifyFacultyToken, (req, res) => {
    res.json({ message: "Token is valid" });
});

router.get('/courses', verifyFacultyToken, (req, res) => {
    const facultyId = req.faculty.id; // corrected from req.user to req.faculty
    
    const query = `
      SELECT c.id, c.code, c.name, c.type
      FROM courses c
      JOIN course_faculty cf ON c.id = cf.course_id
      WHERE cf.faculty_id = ?
    `;
  
    db.query(query, [facultyId], (err, results) => {
      if (err) {
        console.error('Error fetching courses:', err);
        return res.status(500).json({ error: 'Failed to fetch courses' });
      }
      res.json(results);
    });
});


router.get('/report', verifyFacultyToken, async (req, res) => {
    const { courseId } = req.query;
    if (!courseId) {
        return res.status(400).json({ message: "Course ID is required" });
    }

    const fields = [
        "course_outcome_rating",
        "course_content_rating",
        "assignment_rating",
        "faculty_response_rating",
        "faculty_teaching_rating"
    ];

    try {
        const ratingCounts = {};

        for (const field of fields) {
            const query = `
                SELECT ${field} as rating, COUNT(*) as count
                FROM feedback
                WHERE course_id = ?
                GROUP BY ${field}
            `;
            const [results] = await new Promise((resolve, reject) => {
                db.query(query, [courseId], (err, results) => {
                    if (err) reject(err);
                    else resolve([results]);
                });
            });

            // Initialize all ratings (1-5) as 0
            const ratingsArray = [0, 0, 0, 0, 0];
            results.forEach(row => {
                if (row.rating >= 1 && row.rating <= 5) {
                    ratingsArray[row.rating - 1] = row.count;
                }
            });
            ratingCounts[field] = ratingsArray;
        }

        res.json({
            courseOutcomeRatings: ratingCounts.course_outcome_rating,
            courseContentRatings: ratingCounts.course_content_rating,
            assignmentRatings: ratingCounts.assignment_rating,
            facultyResponseRatings: ratingCounts.faculty_response_rating,
            facultyTeachingRatings: ratingCounts.faculty_teaching_rating,
        });

    } catch (error) {
        console.error("Error fetching ratings:", error);
        res.status(500).json({ message: "Database error", error });
    }
});



module.exports = router;  // Export only the router
