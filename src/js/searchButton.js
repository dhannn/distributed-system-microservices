/**
 * This function corresponds to the 'Search' button.
 */

document.addEventListener("DOMContentLoaded", function () {
  const searchButton = document.getElementById("search-button");
  console.log('testssss');
  searchButton.addEventListener("click", async function () {
    // Add search functionality here
    const apptId = document.getElementsByClassName('search-field')[0].textContent;

    try {
    
      const response = await fetch(`appts/id?=${ apptId }`, {
        method: 'GET'
      });
      
      console.log(response);
    
    } catch (error) {
      console.error(error);  
    }


    // Redirect to resulting table page

    alert("Search Clicked");
  });
});
