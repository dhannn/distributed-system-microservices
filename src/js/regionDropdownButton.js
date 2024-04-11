/**
 * This function corresponds to the 'Region' dropdown button.
 */

document.addEventListener("DOMContentLoaded", function () {
  const dropdownBtn = document.querySelector(".book-appt-dropdown-btn");
  const dropdownContent = document.querySelectorAll(".book-appt-dropdown-content a");
  let selectedRegion;

  dropdownContent.forEach(function (regionLink) {
    regionLink.addEventListener("click", function (event) {
      window.selectedRegion = event.target.textContent;
      dropdownBtn.textContent = "Region Selected: " + window.selectedRegion;

      console.log("Clicked on region:", window.selectedRegion);
    });
  });
});
