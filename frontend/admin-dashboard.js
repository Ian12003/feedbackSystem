document.getElementById("addAdminForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const responseMessage = document.getElementById("response-message");

    const token = localStorage.getItem("token");
    
    if (!token) {
        responseMessage.textContent = "Unauthorized access. Please log in.";
        return;
    }

    try {
        const response = await fetch("http://localhost:5000/api/admin/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();
        
        if (response.ok) {
            responseMessage.style.color = "green";
            responseMessage.textContent = "Admin added successfully!";
            
            setTimeout(() => {
                window.location.reload();  // Refresh the page
            }, 800);
        } else {
            // Check if it's a duplicate error
            if (data.message.includes("already exists")) {
                responseMessage.style.color = "red";
                responseMessage.textContent = "Admin already exists!";
            } else {
                responseMessage.style.color = "red";
                responseMessage.textContent = data.message || "Server error. Please try again later.";
            }
        }
    } catch (error) {
        responseMessage.style.color = "red";
        responseMessage.textContent = "Server error. Please try again later.";
    }
});



document.addEventListener("DOMContentLoaded", function () {
    showForm("addAdmin"); // Show Add Admin form by default
});

function showForm(formId) {
    // Hide all forms
    document.querySelectorAll(".form-container").forEach(form => {
        form.classList.remove("active");
    });

    // Show the selected form
    document.getElementById(formId).classList.add("active");
}


// Handle form submission
document.getElementById("addSchoolForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const schoolName = document.getElementById("schoolName").value;
    const responseMessage = document.getElementById("school-response");
    const token = localStorage.getItem("token");

    if (!token) {
        responseMessage.textContent = "Unauthorized access. Please log in.";
        return;
    }

    const response = await fetch("http://localhost:5000/api/admin/add-school", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name: schoolName }),
    });

    const data = await response.json();

    if (response.ok) {
        responseMessage.style.color = "green";
        responseMessage.textContent = "School added successfully!";
        document.getElementById("schoolName").value = "";
        fetchSchools(); // Refresh the table without reloading
    } else {
        responseMessage.style.color = "red";
        responseMessage.textContent = data.message;
    }
});

async function fetchSchools() {
    try {
        const response = await fetch("http://localhost:5000/api/admin/schools");
        const schools = await response.json();

        const tableBody = document.querySelector("#schoolsTable tbody");
        tableBody.innerHTML = "";

        schools.forEach(school => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${school.id}</td>
                <td><span class="school-name">${school.name}</span></td>
                <td>
                    <button onclick="enableEdit(${school.id}, '${school.name}')">Edit</button>
                    <button onclick="deleteSchool(${school.id})">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Failed to fetch schools:", error);
    }
}

async function deleteSchool(id) {
    const token = localStorage.getItem("token");
    if (!confirm("Are you sure you want to delete this school?")) return;

    try {
        const response = await fetch(`http://localhost:5000/api/admin/school/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert("Deleted successfully");
            fetchSchools();
        } else {
            const data = await response.json();
            alert(data.message);
        }
    } catch (err) {
        console.error("Delete error:", err);
    }
}

function enableEdit(id, currentName) {
    const row = [...document.querySelectorAll("#schoolsTable tbody tr")].find(r => 
        r.querySelector("td").textContent == id
    );

    const nameCell = row.querySelector(".school-name");
    nameCell.innerHTML = `<input type="text" value="${currentName}" id="editInput-${id}">`;

    const actionsCell = row.querySelector("td:last-child");
    actionsCell.innerHTML = `
        <button onclick="saveEdit(${id})">Save</button>
        <button onclick="fetchSchools()">Cancel</button>
    `;
}

async function saveEdit(id) {
    const token = localStorage.getItem("token");
    const newName = document.getElementById(`editInput-${id}`).value;

    try {
        const response = await fetch(`http://localhost:5000/api/admin/school/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ name: newName })
        });

        const data = await response.json();
        if (response.ok) {
            alert("Updated successfully");
            fetchSchools();
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error("Edit error:", err);
    }
}

document.addEventListener("DOMContentLoaded", fetchSchools);


document.addEventListener("DOMContentLoaded", async () => {
    const schoolSelect = document.getElementById("schoolSelect");
    const departmentForm = document.getElementById("addDepartmentForm");
    const departmentResponse = document.getElementById("department-response");

    // Fetch schools for dropdown
    async function fetchSchools() {
        try {
            const response = await fetch("http://localhost:5000/api/admin/schools");
            const schools = await response.json();

            schoolSelect.innerHTML = '<option value="">Select School</option>';
            schools.forEach(school => {
                const option = document.createElement("option");
                option.value = school.id;
                option.textContent = school.name;
                schoolSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error fetching schools:", error);
        }
    }

    await fetchSchools();

    // Handle department submission
    departmentForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const schoolId = schoolSelect.value;
        const departmentName = document.getElementById("departmentName").value.trim();
        
        if (!schoolId || !departmentName) {
            departmentResponse.textContent = "Please select a school and enter department name.";
            departmentResponse.style.color = "red";
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/api/admin/add-department", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ school_id: schoolId, name: departmentName })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                departmentResponse.textContent = "Department added successfully!";
                departmentResponse.style.color = "green";
                document.getElementById("departmentName").value = "";
                setTimeout(() => {
                    window.location.reload();  // Refresh the page
                }, 800);
            } else {
                departmentResponse.textContent = data.message;
                departmentResponse.style.color = "red";
            }
        } catch (error) {
            departmentResponse.textContent = "Error adding department.";
            departmentResponse.style.color = "red";
        }
    });
});


document.addEventListener("DOMContentLoaded", async () => {
    const departmentSelect = document.getElementById("departmentSelect");
    const programForm = document.getElementById("addProgramForm");
    const programResponse = document.getElementById("program-response");

    // Fetch departments for dropdown
    async function fetchDepartments() {
        try {
            const response = await fetch("http://localhost:5000/api/admin/departments");
            const departments = await response.json();

            departmentSelect.innerHTML = '<option value="">Select Department</option>';
            departments.forEach(dept => {
                const option = document.createElement("option");
                option.value = dept.id;
                option.textContent = dept.name;
                departmentSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error fetching departments:", error);
        }
    }

    await fetchDepartments();

    // Handle program submission
    programForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const departmentId = departmentSelect.value;
        const programName = document.getElementById("programName").value.trim();
        
        if (!departmentId || !programName) {
            programResponse.textContent = "Please select a department and enter program name.";
            programResponse.style.color = "red";
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/api/admin/add-program", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ department_id: departmentId, name: programName })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                programResponse.textContent = "Program added successfully!";
                programResponse.style.color = "green";
                document.getElementById("programName").value = "";
                setTimeout(() => {
                    window.location.reload();  // Refresh the page
                }, 800);
            } else {
                programResponse.textContent = data.message;
                programResponse.style.color = "red";
            }
        } catch (error) {
            programResponse.textContent = "Error adding program.";
            programResponse.style.color = "red";
        }
    });
});


document.addEventListener("DOMContentLoaded", async () => {
    const departmentSelect = document.getElementById("courseDepartmentSelect");
    const programSelect = document.getElementById("courseProgramSelect");
    const courseForm = document.getElementById("addCourseForm");
    const courseResponse = document.getElementById("course-response");
    const token = localStorage.getItem("token");

    // 1. Load departments into the department dropdown
    async function fetchDepartments() {
        try {
            const response = await fetch("http://localhost:5000/api/admin/departments");
            const departments = await response.json();

            departmentSelect.innerHTML = '<option value="">Select Department</option>';
            departments.forEach(dept => {
                const option = document.createElement("option");
                option.value = dept.id;
                option.textContent = dept.name;
                departmentSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error fetching departments:", error);
        }
    }

    // 2. Load programs based on selected department
    departmentSelect.addEventListener("change", async () => {
        const departmentId = departmentSelect.value;
        if (!departmentId) {
            programSelect.innerHTML = '<option value="">Select department first</option>';
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/admin/programs?department_id=${departmentId}`);
            const programs = await response.json();

            programSelect.innerHTML = '<option value="">Select Program</option>';
            programs.forEach(prog => {
                const option = document.createElement("option");
                option.value = prog.id;
                option.textContent = prog.name;
                programSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error fetching programs:", error);
        }
    });

    // 3. Submit course form
    courseForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("courseName").value.trim();
        const code = document.getElementById("courseCode").value.trim();
        const department_id = departmentSelect.value;
        const program_id = programSelect.value;
        const type = document.getElementById("courseType").value;

        if (!name || !code || !department_id || !program_id || !type) {
            courseResponse.style.color = "red";
            courseResponse.textContent = "Please fill out all fields.";
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/api/admin/add-course", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ name, code, department_id, program_id, type })
            });

            const data = await response.json();

            if (response.ok) {
                courseResponse.style.color = "green";
                courseResponse.textContent = "Course added successfully!";
                courseForm.reset();
                setTimeout(() => {
                    window.location.reload();
                }, 800);
            } else {
                courseResponse.style.color = "red";
                courseResponse.textContent = data.message || "Failed to add course.";
            }
        } catch (error) {
            console.error("Error submitting course:", error);
            courseResponse.style.color = "red";
            courseResponse.textContent = "Server error. Please try again later.";
        }
    });

    await fetchDepartments(); // Load departments on page load
});


document.addEventListener("DOMContentLoaded", async () => {
    const deptSelect = document.getElementById("facultyDepartment");

    // Populate departments
    try {
        const response = await fetch("http://localhost:5000/api/admin/departments");
        const departments = await response.json();

        departments.forEach(dept => {
            const option = document.createElement("option");
            option.value = dept.id;
            option.textContent = dept.name;
            deptSelect.appendChild(option);
        });
    } catch (err) {
        console.error("Failed to load departments:", err);
    }
});

document.getElementById("addFacultyForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("facultyName").value;
    const email = document.getElementById("facultyEmail").value;
    const password = document.getElementById("facultyPassword").value;
    const department_id = document.getElementById("facultyDepartment").value;
    const responseMessage = document.getElementById("facultyResponseMessage");

    const token = localStorage.getItem("token");

    if (!token) {
        responseMessage.textContent = "Unauthorized access. Please log in.";
        return;
    }

    try {
        const response = await fetch("http://localhost:5000/api/admin/add-faculty", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ name, email, password, department_id }),
        });

        const data = await response.json();
        console.log("Response from backend:", data);

        if (response.ok) {
            responseMessage.style.color = "green";
            responseMessage.textContent = "Faculty added successfully!";
            setTimeout(() => window.location.reload(), 800);
        } else {
            responseMessage.style.color = "red";
            responseMessage.textContent = data.message || "Server error. Please try again later.";
        }
    } catch (error) {
        responseMessage.style.color = "red";
        responseMessage.textContent = "Server error. Please try again later.";
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    const assignFacultyForm = document.getElementById("assignFacultyForm");
    const assignCourseSelect = document.getElementById("assignCourseSelect");
    const assignFacultySelect = document.getElementById("assignFacultySelect");
    const assignResponse = document.getElementById("assign-response");
    const token = localStorage.getItem("token");

    // 1. Load courses into the course dropdown
    async function fetchCourses() {
        try {
            const response = await fetch("http://localhost:5000/api/admin/courses", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const courses = await response.json();

            assignCourseSelect.innerHTML = '<option value="">Select Course</option>';
            courses.forEach(course => {
                const option = document.createElement("option");
                option.value = course.id;
                option.textContent = `${course.name} (${course.code})`; // Display course name and code
                assignCourseSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error fetching courses:", error);
        }
    }

    // 2. Load faculty into the faculty dropdown
    async function fetchFaculty() {
        try {
            const response = await fetch("http://localhost:5000/api/admin/faculty", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const faculty = await response.json();

            assignFacultySelect.innerHTML = '<option value="">Select Faculty</option>';
            faculty.forEach(faculty => {
                const option = document.createElement("option");
                option.value = faculty.id;
                option.textContent = faculty.name; // Display faculty name
                assignFacultySelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error fetching faculty:", error);
        }
    }

    // 3. Handle faculty assignment to course
    assignFacultyForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const course_id = assignCourseSelect.value;
        const faculty_id = assignFacultySelect.value;

        if (!course_id || !faculty_id) {
            assignResponse.style.color = "red";
            assignResponse.textContent = "Please select both course and faculty.";
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/api/admin/assign-faculty", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ course_id, faculty_id })
            });

            const data = await response.json();

            if (response.ok) {
                assignResponse.style.color = "green";
                assignResponse.textContent = "Faculty assigned successfully!";
                assignFacultyForm.reset();
            } else {
                assignResponse.style.color = "red";
                assignResponse.textContent = data.message || "Failed to assign faculty.";
            }
        } catch (error) {
            console.error("Error assigning faculty:", error);
            assignResponse.style.color = "red";
            assignResponse.textContent = "Server error. Please try again later.";
        }
    });

    // Load courses and faculty when the page loads
    await fetchCourses();
    await fetchFaculty();
});

document.addEventListener("DOMContentLoaded", function () {
    const adminName = localStorage.getItem("adminName");
    if (adminName) {
        document.getElementById("adminNameDisplay").textContent = `Welcome, ${adminName}!`;
    } else {
        document.getElementById("adminNameDisplay").textContent = "Welcome, Admin!";
    }
});

document.getElementById("logoutButton").addEventListener("click", function () {
    localStorage.clear(); // Remove stored data
    window.location.href = "index.html"; // Redirect to login page

    // Prevent going back to the dashboard after logout
    history.pushState(null, null, "index.html");
    window.addEventListener("popstate", function () {
        history.pushState(null, null, "index.html");
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem("token");

    if (!token) {
        // If no token is found, redirect to the login page
        window.location.href = "index.html";
    }
});
