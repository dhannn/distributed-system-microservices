/**
 * This function corresponds to the 'Generate Report' button.
 */

document.addEventListener("DOMContentLoaded", function() {
    const createReportBtn = document.querySelector(".create-report-btn");
    createReportBtn.addEventListener("click", async function() {
      // Add generate report functionality here
      try {
        const response = await fetch('report/');
        if (response.ok) {
          window.location.href = `pages/table.html?apptId=${apptId}`;
        }
      } catch (error) {
        console.error(error);
      }
        
      alert("Generate Report Clicked");
    });
  });
  