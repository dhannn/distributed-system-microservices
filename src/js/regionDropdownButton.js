/**
 * This function corresponds to the 'Region' dropdown button.
 */

document.addEventListener("DOMContentLoaded", function () {
  const dropdownBtn = document.querySelector(".book-appt-dropdown-btn");
  const dropdownContent = document.querySelectorAll(".book-appt-dropdown-content a");
  const selectedRegionInput = document.querySelector(".selected-region");

  dropdownBtn.addEventListener("click", function () {
    console.log("Clicked on region");
  });

  dropdownContent.forEach(function (regionLink) {
    regionLink.addEventListener("click", function (event) {
      const selectedRegion = event.target.textContent;
      selectedRegionInput.value = selectedRegion;
      dropdownBtn.textContent = "Region Selected: " + selectedRegion; // Update button text
      
      // use 'selectedRegion'
      
      //console.log("Clicked on region:", selectedRegion);
    });
  });
});