const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
require("dotenv").config();

const router = express.Router();
// Admin login route
router.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    // Check if the admin exists
    db.query("SELECT * FROM admins WHERE email = ?", [email], async (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Database error", error: err });
        }
        if (results.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const admin = results[0];

        // Compare the entered password with the stored hashed password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Generate a JWT token
        const token = jwt.sign({ id: admin.id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

res.json({ 
    message: "Login successful", 
    token,
    adminName: admin.name // Send admin name to frontend
});
    });
});

// Middleware to verify admin authentication
function verifyToken(req, res, next) {
    const token = req.headers["authorization"];
    if (!token) {
        return res.status(403).json({ message: "Unauthorized access" });
    }
    try {
        const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
}
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate inputs
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // Check if admin already exists
        const [rows] = await db.promise().query("SELECT * FROM admins WHERE email = ?", [email]);
        if (rows.length > 0) {
            return res.status(400).json({ message: "Admin already exists." });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new admin
        await db.promise().query("INSERT INTO admins (name, email, password) VALUES (?, ?, ?)", [name, email, hashedPassword]);

        res.status(201).json({ message: "Admin added successfully!" });

    } catch (error) {
        console.error("Error adding admin:", error);
        res.status(500).json({ message: "Server error. Please try again later." });
    }
});

router.get("/verify", verifyToken, (req, res) => {
    res.json({ message: "Token is valid" });
});


// Add a new school (Prevents duplicate entries)
router.post("/add-school", verifyToken, (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: "School name is required" });
    }

    // Check if school already exists (Case-insensitive)
    db.query("SELECT * FROM schools WHERE LOWER(name) = LOWER(?)", [name], (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Database error", error: err });
        }
        if (results.length > 0) {
            return res.status(400).json({ message: "School already exists" });
        }

        // Insert the new school
        db.query("INSERT INTO schools (name) VALUES (?)", [name], (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Database error", error: err });
            }
            res.status(201).json({ message: "School added successfully" });
        });
    });
});

// Fetch all schools
router.get("/schools", (req, res) => {
    db.query("SELECT * FROM schools", (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Database error", error: err });
        }
        res.json(results);
    });
});
router.delete("/school/:id", verifyToken, (req, res) => {
    const schoolId = req.params.id;

    db.query("DELETE FROM schools WHERE id = ?", [schoolId], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error", error: err });

        res.json({ message: "School deleted successfully" });
    });
});
router.put("/school/:id", verifyToken, (req, res) => {
    const schoolId = req.params.id;
    const { name } = req.body;

    if (!name) return res.status(400).json({ message: "School name is required" });

    db.query("UPDATE schools SET name = ? WHERE id = ?", [name, schoolId], (err, result) => {
        if (err) return res.status(500).json({ message: "Database error", error: err });

        res.json({ message: "School updated successfully" });
    });
});

// Add a department under a school (Prevents duplicate entries)
router.post("/add-department", verifyToken, (req, res) => {
    const { school_id, name } = req.body;

    if (!school_id || !name) {
        return res.status(400).json({ message: "School and department name are required" });
    }

    // Ensure the school exists
    db.query("SELECT * FROM schools WHERE id = ?", [school_id], (err, schoolResults) => {
        if (err) {
            return res.status(500).json({ message: "Database error", error: err });
        }
        if (schoolResults.length === 0) {
            return res.status(400).json({ message: "Invalid school ID" });
        }

        // Check if department exists in the same school (Case-insensitive)
        db.query(
            "SELECT * FROM departments WHERE LOWER(name) = LOWER(?) AND school_id = ?",
            [name, school_id],
            (err, results) => {
                if (err) {
                    return res.status(500).json({ message: "Database error", error: err });
                }
                if (results.length > 0) {
                    return res.status(400).json({ message: "Department already exists in this school" });
                }

                // Insert new department
                db.query(
                    "INSERT INTO departments (name, school_id) VALUES (?, ?)",
                    [name, school_id],
                    (err, result) => {
                        if (err) {
                            return res.status(500).json({ message: "Database error", error: err });
                        }
                        res.status(201).json({ message: "Department added successfully" });
                    }
                );
            }
        );
    });
});

// Fetch all departments
router.get("/departments", (req, res) => {
    db.query("SELECT * FROM departments", (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Database error", error: err });
        }
        res.json(results);
    });
});

// Add a program under a department (Prevents duplicate entries)
router.post("/add-program", verifyToken, (req, res) => {
    const { department_id, name } = req.body;

    if (!department_id || !name) {
        return res.status(400).json({ message: "Department and program name are required" });
    }

    // Ensure the department exists
    db.query("SELECT * FROM departments WHERE id = ?", [department_id], (err, deptResults) => {
        if (err) {
            return res.status(500).json({ message: "Database error", error: err });
        }
        if (deptResults.length === 0) {
            return res.status(400).json({ message: "Invalid department ID" });
        }

        // Check if the program already exists in the department (Case-insensitive)
        db.query(
            "SELECT * FROM programs WHERE LOWER(name) = LOWER(?) AND department_id = ?",
            [name, department_id],
            (err, results) => {
                if (err) {
                    return res.status(500).json({ message: "Database error", error: err });
                }
                if (results.length > 0) {
                    return res.status(400).json({ message: "Program already exists in this department" });
                }

                // Insert the new program
                db.query(
                    "INSERT INTO programs (name, department_id) VALUES (?, ?)",
                    [name, department_id],
                    (err, result) => {
                        if (err) {
                            return res.status(500).json({ message: "Database error", error: err });
                        }
                        res.status(201).json({ message: "Program added successfully" });
                    }
                );
            }
        );
    });
});

// Fetch all programs
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


// Add a course under a program
router.post("/add-course", verifyToken, (req, res) => {
    const { name, code, type, program_id, department_id } = req.body;

    if (!name || !code || !type || !program_id || !department_id) {
        return res.status(400).json({ message: "All fields are required (name, code, type, program_id, department_id)." });
    }

    // Ensure program and department exist
    db.query("SELECT * FROM programs WHERE id = ?", [program_id], (err, programResults) => {
        if (err) return res.status(500).json({ message: "Database error", error: err });
        if (programResults.length === 0) return res.status(400).json({ message: "Invalid program ID" });

        db.query("SELECT * FROM departments WHERE id = ?", [department_id], (err, departmentResults) => {
            if (err) return res.status(500).json({ message: "Database error", error: err });
            if (departmentResults.length === 0) return res.status(400).json({ message: "Invalid department ID" });

            // Insert course with department_id
            db.query(
                "INSERT INTO courses (name, code, type, program_id, department_id) VALUES (?, ?, ?, ?, ?)",
                [name, code, type, program_id, department_id],
                (err, result) => {
                    if (err) {
                        if (err.code === "ER_DUP_ENTRY") {
                            return res.status(400).json({ message: "Course code already exists." });
                        }
                        return res.status(500).json({ message: "Database error", error: err });
                    }
                    res.status(201).json({ message: "Course added successfully" });
                }
            );
        });
    });
});


// Add a faculty under a department
router.post("/add-faculty", verifyToken, async (req, res) => {
    const { name, email, password, department_id } = req.body;

    if (!name || !email || !password || !department_id) {
        return res.status(400).json({ message: "All fields are required (name, email, password, department_id)" });
    }

    try {
        // Check if department exists
        const [deptRows] = await db.promise().query("SELECT * FROM departments WHERE id = ?", [department_id]);
        if (deptRows.length === 0) {
            return res.status(400).json({ message: "Invalid department ID" });
        }

        // Check for duplicate email
        const [existing] = await db.promise().query("SELECT * FROM faculty WHERE email = ?", [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: "Faculty already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            await db.promise().query(
                "INSERT INTO faculty (name, email, password, department_id) VALUES (?, ?, ?, ?)",
                [name, email, hashedPassword, department_id]
            );
            res.status(201).json({ message: "Faculty added successfully" });
        } catch (insertError) {
            console.error("Insert error:", insertError);
            res.status(500).json({ message: "Insert failed", error: insertError });
        }
            } catch (error) {
        console.error("Error adding faculty:", error);
        res.status(500).json({ message: "Server error", error });
    }
});


router.get("/faculty", (req, res) => {
    db.query("SELECT * FROM faculty", (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Database error", error: err });
        }
        res.json(results);
    });
});

// Fetch all courses for the admin
router.get("/courses", verifyToken, (req, res) => {
    db.query("SELECT * FROM courses", (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Database error", error: err });
        }
        res.status(200).json(results);
    });
});

// Assign Faculty to Course
router.post("/assign-faculty", verifyToken, (req, res) => {
    const { course_id, faculty_id } = req.body;

    if (!course_id || !faculty_id) {
        return res.status(400).json({ message: "Course ID and Faculty ID are required." });
    }

    // Check if the course exists
    db.query(
        "SELECT * FROM course_faculty WHERE course_id = ? AND faculty_id = ?",
        [course_id, faculty_id],
        (err, results) => {
          if (err) {
            return res.status(500).json({ message: "Database error", error: err });
          }
          if (results.length > 0) {
            return res.status(400).json({ message: "Faculty is already assigned to this course" });
          }
      
          // Proceed with insert
          db.query(
            "INSERT INTO course_faculty (course_id, faculty_id) VALUES (?, ?)",
            [course_id, faculty_id],
            (err, result) => {
              if (err) {
                console.error("Insert error in course_faculty:", err);
                return res.status(500).json({ message: "Failed to assign faculty", error: err });
              }
              res.status(201).json({ message: "Faculty assigned to course successfully." });
            }
          );
        }
      );
      
});

module.exports = router;
