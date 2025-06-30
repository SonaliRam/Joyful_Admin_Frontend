function loginUser() {
  const email = document.getElementById("UserID").value.trim();
  const password = document.getElementById("password").value;

  // Admin login check
  if (email === "JoyFul" && password === "JoyFul@654") {
    alert("Admin login successful ✅");
    localStorage.setItem("admin", "true");
    window.location.href = "Dashboard.html"; // Redirect to Admin Dashboard
   
  } else {
    alert("Invalid credentials. Please try again.");
  }
}

