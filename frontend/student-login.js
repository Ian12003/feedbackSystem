document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("student-login-form");
  const registerForm = document.getElementById("student-register-form");
  const departmentSelect = document.getElementById("register-department");
  const programSelect = document.getElementById("register-program");
  const showLogin = document.getElementById("showLogin");
  const showRegister = document.getElementById("showRegister");

  // Toggle between login and register forms
  showLogin.addEventListener("click", () => {
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    showLogin.classList.add("active");
    showLogin.classList.remove("inactive");
    showRegister.classList.remove("active");
    showRegister.classList.add("inactive");
  });

  showRegister.addEventListener("click", () => {
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    showRegister.classList.add("active");
    showRegister.classList.remove("inactive");
    showLogin.classList.remove("active");
    showLogin.classList.add("inactive");
  });

  // Fetch departments
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

  // Fetch programs based on department
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

  fetchDepartments();

  // Registration
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("register-name").value;
    const rollno = document.getElementById("register-rollno").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    const department_id = departmentSelect.value;
    const program_id = programSelect.value;

    const res = await fetch("/api/student/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, rollno, email, password, department_id, program_id })
    });

    const data = await res.json();
    alert(data.message);
    if (res.ok) registerForm.reset();
  });

  // Login
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const rollno = document.getElementById("login-rollno").value;
  const password = document.getElementById("login-password").value;

  const res = await fetch("/api/student/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rollno, password })
  });

  const data = await res.json();
  if (res.ok) {
    // Store the token, rollno, and name in localStorage
    localStorage.setItem("studentToken", data.token);
    localStorage.setItem("studentRollno", rollno);  // Save rollno
    localStorage.setItem("studentName", data.studentName);  // Save name

    alert("Login successful!");
    window.location.href = "/student-dashboard.html";
  } else {
    alert(data.message);
  }
});
});
