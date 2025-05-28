const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const JWT_SECRET = process.env.JWT_SECRET;

// Helper: Generate a random password
function generatePassword(length = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Forgot Password route
router.post("/forgot-password", (req, res) => {
  const { emailOrRoll } = req.body;

  // Use callback-based query for fetching student data
  db.query(
    "SELECT * FROM students WHERE email = ? OR rollno = ? LIMIT 1",
    [emailOrRoll, emailOrRoll],
    async (err, results) => {
      if (err) {
        console.error("Error querying student data:", err);
        return res.status(500).json({ message: "Internal server error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Student not found" });
      }

      const studentData = results[0];
      const newPassword = generatePassword();
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password using callback
      db.query(
        "UPDATE students SET password = ? WHERE id = ?",
        [hashedPassword, studentData.id],
        (err, updateResult) => {
          if (err) {
            console.error("Error updating password:", err);
            return res.status(500).json({ message: "Internal server error" });
          }

          // Send email after password update
          transporter.sendMail(
            {
              from: process.env.SMTP_FROM,
              to: studentData.email,
              subject: "Password Reset - Student Portal",
              text: `Hello ${studentData.name},\n\nYour new password is: ${newPassword}\n\nPlease login and change it immediately.`,
            },
            (err, info) => {
              if (err) {
                console.error("Error sending email:", err);
                return res.status(500).json({ message: "Failed to send email" });
              }

              res.json({ message: "New password sent to your email" });
            }
          );
        }
      );
    }
  );
});
;

// Change Password Route
// Change Password Route
router.post("/change-password", verifyToken, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const studentId = req.student.id; // Get student ID from the JWT token

  // Fetch the student's existing password from the database using callback-based API
  db.query("SELECT * FROM students WHERE id = ?", [studentId], async (err, results) => {
    if (err) {
      console.error("Error fetching student:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    const existingPassword = results[0].password;

    // Check if the old password matches
    bcrypt.compare(oldPassword, existingPassword, (err, isMatch) => {
      if (err) {
        console.error("Error comparing passwords:", err);
        return res.status(500).json({ message: "Internal server error" });
      }

      if (!isMatch) {
        return res.status(401).json({ message: "Old password is incorrect" });
      }

      // Hash the new password
      bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
        if (err) {
          console.error("Error hashing new password:", err);
          return res.status(500).json({ message: "Internal server error" });
        }

        // Update the password in the database
        db.query("UPDATE students SET password = ? WHERE id = ?", [hashedPassword, studentId], (err) => {
          if (err) {
            console.error("Error updating password:", err);
            return res.status(500).json({ message: "Internal server error" });
          }

          res.json({ message: "Password changed successfully" });
        });
      });
    });
  });
});

// Student Registration
router.post("/register", async (req, res) => {
    const { name, rollno, email, password, department_id, program_id } = req.body;

    // Check if roll number already exists
    db.query("SELECT * FROM students WHERE rollno = ?", [rollno], async (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (results.length > 0) return res.status(400).json({ message: "Student already registered" });

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert into students table
        db.query(
            "INSERT INTO students (name, rollno, email, password, department_id, program_id) VALUES (?, ?, ?, ?, ?, ?)",
            [name, rollno, email, hashedPassword, department_id, program_id],
            (err, result) => {
                if (err) return res.status(500).json({ message: "Registration failed" });
                res.status(201).json({ message: "Student registered successfully" });
            }
        );
    });
});

// Student Login
router.post("/login", (req, res) => {
    const { rollno, password } = req.body;

    db.query("SELECT * FROM students WHERE rollno = ?", [rollno], async (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (results.length === 0) return res.status(401).json({ message: "Invalid roll number or password" });

        const student = results[0];

        const isMatch = await bcrypt.compare(password, student.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid roll number or password" });

        const token = jwt.sign(
            { id: student.id, name: student.name, rollno: student.rollno, role: "student" }, // Include rollno in the payload
            JWT_SECRET,
            { expiresIn: "1h" }
        );
        res.json({
            message: "Login successful",
            token,
            studentName: student.name
        });
    });
});

// Get all departments
router.get("/departments", (req, res) => {
    db.query("SELECT * FROM departments", (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Database error", error: err });
        }
        res.json(results);
    });
});

// Get programs by department_id
router.get("/programs", (req, res) => {
    const { department_id } = req.query;

    let query = "SELECT * FROM programs";
    const params = [];

    if (department_id) {
        query += " WHERE department_id = ?";
        params.push(department_id);
    }

    db.query(query, params, (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "Database error", error: err });
        }
        res.json(results);
    });
});


router.get("/courses", (req, res) => {
    const { department_id } = req.query;
  
    let query = "SELECT * FROM courses";
    const params = [];
  
    if (department_id) {
      query += " WHERE department_id = ?";
      params.push(department_id);
    }
  
    db.query(query, params, (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Database error", error: err });
      }
      res.json(results);
    });
  });
  

  router.get("/faculty", (req, res) => {
    const { department_id } = req.query;
  
    let query = "SELECT * FROM faculty";
    const params = [];
  
    if (department_id) {
      query += " WHERE department_id = ?";
      params.push(department_id);
    }
  
    db.query(query, params, (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Database error", error: err });
      }
      res.json(results);
    });
  });
  
// Middleware to verify student authentication
function verifyToken(req, res, next) {
    const token = req.headers["authorization"];
    if (!token) {
        return res.status(403).json({ message: "Unauthorized access" });
    }
    try {
        const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
        req.student = decoded; // Store the student info in the request
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
}

// Submit feedback
router.post("/submit-feedback", verifyToken, (req, res) => { // Protect route with token verification
  const {
    course_id,
    faculty_id,
    course_outcome_rating,
    course_content_rating,
    assignment_rating,
    faculty_response_rating,
    faculty_teaching_rating,
    comments
  } = req.body;

  const student_id = req.student.id; // Get the student ID from the verified token

  const query = `
    INSERT INTO feedback 
    (student_id, course_id, faculty_id, course_outcome_rating, course_content_rating, assignment_rating, faculty_response_rating, faculty_teaching_rating, comments)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    student_id,
    course_id,
    faculty_id,
    course_outcome_rating,
    course_content_rating,
    assignment_rating,
    faculty_response_rating,
    faculty_teaching_rating,
    comments || ""
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Error submitting feedback:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.status(201).json({ message: "Feedback submitted successfully" });
  });
});

  
module.exports = router;
