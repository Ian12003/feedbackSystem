// Protect the page by checking token
document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("studentToken");
  if (!token) {
    window.location.href = "/index.html";
    return;
  }

  // Decode and display name
  const payload = JSON.parse(atob(token.split('.')[1]));

  // Prevent access via back button after logout
  window.addEventListener("pageshow", function (event) {
    if (event.persisted || performance.getEntriesByType("navigation")[0].type === "back_forward") {
      // Force a full reload so token check happens again
      window.location.reload();
    }
  });
});

// Buttons
function goToFeedback() {
  window.location.href = "/feedback-form.html";
}

function goToChangePassword() {
  window.location.href = "/change-password.html"; // Redirect to the Change Password page
}

// Logout handler
document.getElementById("logoutButton").addEventListener("click", function () {
  localStorage.clear(); // Clear all tokens/data
  window.location.href = "/index.html";
});
document.addEventListener("DOMContentLoaded", () => {
  const studentName = localStorage.getItem("studentName");

  if ( studentName) {
    // Ensure that the elements exist before trying to set their values
    const studentNameElement = document.getElementById("student-name");

    if (studentNameElement ) {
      studentNameElement.textContent = `Welcome ${studentName}`;
    } else {
      console.error("Required elements not found in the HTML.");
    }
  } else {
    window.location.href = "/index.html"; // Redirect to login page if not logged in
  }
});
