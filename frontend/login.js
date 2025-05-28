document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorMessage = document.getElementById("error-message");

    const response = await fetch("http://localhost:5000/api/admin/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("adminName", data.adminName); // Store admin name
                window.location.href = "admin-dashboard.html";
    } else {
        errorMessage.textContent = data.message;
    }
});
document.getElementById("facultyLoginForm")?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("facultyEmail").value;
    const password = document.getElementById("facultyPassword").value;

    const res = await fetch("http://localhost:5000/api/faculty/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (res.ok) {
        alert("Faculty login success");
        localStorage.setItem("token", data.token);
        localStorage.setItem("facultyName", data.facultyName);
        window.location.href = "/faculty-dashboard.html"; // Change if needed
    } else {
        document.getElementById("faculty-error-message").textContent = data.message || "Login failed";
    }
});
document.getElementById("showAdmin").addEventListener("click", () => {
    document.getElementById("adminLoginContainer").classList.add("active");
    document.getElementById("facultyLoginContainer").classList.remove("active");
});

document.getElementById("showFaculty").addEventListener("click", () => {
    document.getElementById("facultyLoginContainer").classList.add("active");
    document.getElementById("adminLoginContainer").classList.remove("active");
});

// Show admin by default
document.getElementById("adminLoginContainer").classList.add("active");
