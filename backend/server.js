const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const adminRoutes = require("./routes/admin");
const studentRoutes = require("./routes/student");
const facultyRoutes = require("./routes/faculty");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, "../frontend"))); 

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use('/api/faculty', facultyRoutes);

// Default route to serve login page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
