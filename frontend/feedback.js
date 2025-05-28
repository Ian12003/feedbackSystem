document.addEventListener("DOMContentLoaded", () => {
  fetchDepartments();

  const feedbackForm = document.getElementById("feedbackForm");
  const departmentSelect = document.getElementById("department_id");

  // Load courses and faculty when department is selected
  departmentSelect.addEventListener("change", () => {
    const deptId = departmentSelect.value;
    if (deptId) {
      fetchCourses(deptId);
      fetchFaculty(deptId);
    }
  });

  feedbackForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("studentToken");
    if (!token) {
      alert("You must be logged in to submit feedback.");
      return;
    }

    let student_id;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      student_id = payload.id;
    } catch (error) {
      console.error("Invalid token:", error);
      alert("Session expired or invalid. Please log in again.");
      return;
    }

    const formData = new FormData(feedbackForm);
    const data = {
      student_id,
      course_id: formData.get("course_id"),
      faculty_id: formData.get("faculty_id"),
      course_outcome_rating: formData.get("course_outcome_rating"),
      course_content_rating: formData.get("course_content_rating"),
      assignment_rating: formData.get("assignment_rating"),
      faculty_response_rating: formData.get("faculty_response_rating"),
      faculty_teaching_rating: formData.get("faculty_teaching_rating"),
      comments: formData.get("comments")
    };

    try {
      const response = await fetch("/api/student/submit-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        alert("Feedback submitted successfully!");
        feedbackForm.reset();
      } else {
        alert(result.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("Error submitting feedback");
    }
  });

  // Show student name and roll number
  const rollno = localStorage.getItem("studentRollno");
  const studentName = localStorage.getItem("studentName");

  if (rollno && studentName) {
    const studentNameElement = document.getElementById("student-name");
    const studentRollnoElement = document.getElementById("student-rollno");

    if (studentNameElement && studentRollnoElement) {
      studentNameElement.textContent = `Name: ${studentName}`;
      studentRollnoElement.textContent = `Roll Number: ${rollno}`;
    } else {
      console.error("Required elements not found in the HTML.");
    }
  } else {
    window.location.href = "/index.html";
  }
});

// Fetch all departments
function fetchDepartments() {
  fetch("/api/student/departments")
    .then(res => res.json())
    .then(data => {
      const departmentSelect = document.getElementById("department_id");
      departmentSelect.innerHTML = `<option value="">-- Select Department --</option>`;
      data.forEach(department => {
        const option = document.createElement("option");
        option.value = department.id;
        option.textContent = department.name;
        departmentSelect.appendChild(option);
      });
    })
    .catch(err => {
      console.error("Error fetching departments:", err);
    });
}

// Fetch courses based on department
function fetchCourses(departmentId) {
  fetch(`/api/student/courses?department_id=${departmentId}`)
    .then(res => res.json())
    .then(data => {
      const courseSelect = document.getElementById("course_id");
      courseSelect.innerHTML = `<option value="">-- Select Course --</option>`;
      data.forEach(course => {
        const option = document.createElement("option");
        option.value = course.id;
        option.textContent = course.name;
        courseSelect.appendChild(option);
      });
    })
    .catch(err => {
      console.error("Error fetching courses:", err);
    });
}

// Fetch faculty based on department
function fetchFaculty(departmentId) {
  fetch(`/api/student/faculty?department_id=${departmentId}`)
    .then(res => res.json())
    .then(data => {
      const facultySelect = document.getElementById("faculty_id");
      facultySelect.innerHTML = `<option value="">-- Select Faculty --</option>`;
      data.forEach(faculty => {
        const option = document.createElement("option");
        option.value = faculty.id;
        option.textContent = faculty.name;
        facultySelect.appendChild(option);
      });
    })
    .catch(err => {
      console.error("Error fetching faculty:", err);
    });
}
