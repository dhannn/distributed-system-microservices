/**
 * This function corresponds to the 'Search' button.
 */

document.addEventListener("DOMContentLoaded", function () {
  const searchButton = document.getElementById("search-button");
  searchButton.addEventListener("click", async function () {
    // Add search functionality here
    const apptId = document.getElementsByClassName("search-field")[0].value;

    try {
      console.log(apptId);

      const response = await fetch(`appts/id?=${apptId}`, {
        method: "GET",
      });
      if (response.ok) {
        if (apptId) {
          window.location.href = `pages/table.html?apptId=${apptId}`;
        } else {
          window.location.href = `pages/table.html`;
        }
      }
    } catch (error) {
      console.error(error);
    }
  });
});
