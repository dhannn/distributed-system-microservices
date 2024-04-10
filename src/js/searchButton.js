document.addEventListener("DOMContentLoaded", function () {
  const searchButton = document.getElementById("search-button");
  searchButton.addEventListener("click", async function () {
    const apptId = document.getElementsByClassName("search-field")[0].value;
    
    if (!apptId) {
      alert("Please enter an appointment ID.");
      return;
    }

    try {
      console.log(apptId);

      const response = await fetch(`appts/id?=${apptId}`, {
        method: "GET",
      });
      if (response.ok) {
        window.location.href = `pages/table.html?apptId=${apptId}`;
      }
    } catch (error) {
      console.error(error);
    }
  });
});
