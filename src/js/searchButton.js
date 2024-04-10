/**
 * This function corresponds to the 'Search' button.
 */

document.addEventListener("DOMContentLoaded", function () {
  const searchButton = document.getElementById("search-button");
  searchButton.addEventListener("click", async function () {
    const apptId = document.getElementsByClassName("search-field")[0].textContent;
    let url = "appts";
    if (apptId) {
      url += `/${apptId}`;
    }

    try {
      const response = await fetch(url, {
        method: "GET",
      });
      if (response.ok) {
        if (apptId) {
          window.location.href = `table.html?apptId=${apptId}`;
        } else {
          window.location.href = `table.html`;
        }
      }
    } catch (error) {
      console.error(error);
    }
  });
});
