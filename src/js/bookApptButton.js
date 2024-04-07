/**
 * This function corresponds to the 'Book Appointment' button.
 */

document.addEventListener("DOMContentLoaded", function() {
    const bookApptBtn = document.querySelector(".book-appt-btn");
    bookApptBtn.addEventListener("click", function() {
      // Add book appointment functionality here


      // Redirect to resulting table page
      window.location.href = "../pages/table.html";
    });
  });
  