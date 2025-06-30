// ✅ Check if admin is logged in
function checkAdminAccess() {
  const isAdmin = localStorage.getItem("admin");
  if (!isAdmin) {
    alert("Access denied! You must be logged in as admin.");
    window.location.href = "Login.html";
  }
}

// ✅ Logout admin
function logout() {
  localStorage.removeItem("admin");
  window.location.href = "Login.html";
}

// ✅ Run everything on page load
window.onload = checkAdminAccess;
