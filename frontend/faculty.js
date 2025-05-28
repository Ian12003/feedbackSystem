document.addEventListener("DOMContentLoaded", function () {
  const facultyName = document.getElementById("facultyName");
  const courseList = document.getElementById("courseList");
  const logoutButton = document.getElementById("logoutButton");
  const reportSection = document.getElementById("reportSection");
  const feedbackChart = document.getElementById("feedbackChart");

  const token = localStorage.getItem("token");
  const payload = JSON.parse(atob(token.split('.')[1]));


  if (!token) {
      window.location.href = "/login.html"; // or your login page
  } else {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const facultyName = payload.name;
  
      const nameElement = document.getElementById("faculty-name");
      if (nameElement) {
          nameElement.textContent = `Welcome ${facultyName}`;
      }
  }
  
  fetch("/api/faculty/courses", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
    .then(response => response.json())
    .then(courses => {
      if (courses.length === 0) {
        courseList.innerHTML = "<li>No courses assigned</li>";
      } else {
        courses.forEach(course => {
          const listItem = document.createElement("li");
          listItem.textContent = `${course.name} (${course.code})`;
          listItem.setAttribute("data-course-id", course.id);
          courseList.appendChild(listItem);
        });
      }
    })
    .catch(error => {
      console.error("Error fetching courses:", error);
      courseList.innerHTML = "<li>Error loading courses</li>";
    });

  courseList.addEventListener("click", function (event) {
    const courseId = event.target.getAttribute("data-course-id");
    if (courseId) {
      fetchFeedbackReport(courseId);
    }
  });

  function fetchFeedbackReport(courseId) {
    fetch(`/api/faculty/report?courseId=${courseId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(response => response.json())
      .then(data => {
        const ratingsData = {
          courseOutcomeRatings: data.courseOutcomeRatings,
          courseContentRatings: data.courseContentRatings,
          assignmentRatings: data.assignmentRatings,
          facultyResponseRatings: data.facultyResponseRatings,
          facultyTeachingRatings: data.facultyTeachingRatings
        };
  
        reportSection.style.display = "block";
  
        const ctx = feedbackChart.getContext("2d");
        let chartInstance;
  
        const chartSelector = document.getElementById("chartSelector");
  
        function renderPieChart(type) {
          if (chartInstance) {
            chartInstance.destroy();
          }
  
          chartInstance = new Chart(ctx, {
            type: "pie",
            data: {
              labels: ["1", "2", "3", "4", "5"],
              datasets: [{
                label: type,
                data: ratingsData[type],
                backgroundColor: [
                  "rgba(255, 99, 132, 0.6)",
                  "rgba(54, 162, 235, 0.6)",
                  "rgba(255, 206, 86, 0.6)",
                  "rgba(75, 192, 192, 0.6)",
                  "rgba(153, 102, 255, 0.6)"
                ],
                borderColor: "#fff",
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: {
                  position: "top"
                },
                title: {
                  display: true,
                  text: type.replace(/([A-Z])/g, ' $1') // Makes text more readable
                }
              }
            }
          });
        }
  
        // Initial chart
        renderPieChart("courseOutcomeRatings");
  
        // Change chart on dropdown selection
        chartSelector.addEventListener("change", function () {
          const selected = chartSelector.value;
          renderPieChart(selected);
        });
      })
      .catch(error => {
        console.error("Error fetching feedback report:", error);
        alert("Failed to fetch feedback report");
      });
  }
  
  logoutButton.addEventListener("click", function () {
    localStorage.removeItem("token");
    localStorage.removeItem("facultyName");
    window.location.href = "/index.html";
  });
});

