/**
 * This function corresponds to the 'Book Appointment' button.
 */

document.addEventListener("DOMContentLoaded", function () {
  const bookApptBtn = document.querySelector(".book-appt-btn");
  bookApptBtn.addEventListener("click", function () {
    const selectedRegion = document.querySelector(".selected-region").value;

    fetch("/appts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ region: selectedRegion }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Success:", data);
        const apptId = data[0].id;
        window.location.href = `../pages/table.html?apptId=${apptId}`;
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  });
});
