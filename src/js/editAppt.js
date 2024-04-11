function attachEditButtonListeners() {
  document.querySelectorAll(".edit-btn").forEach((editBtn) => {
    editBtn.addEventListener("click", function () {
      const row = this.parentNode.parentNode;

      const id = row.children[0].textContent;
      const statusCell = row.children[3];

      const currentStatus = statusCell.textContent;
      statusCell.innerHTML = `<input type="text" value="${currentStatus}">`;
      const input = statusCell.children[0];

      input.addEventListener("blur", function () {
        const newStatus = this.value;

        // Send a PUT request to the server-side script
        fetch(`appts/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.message === "Appointment status updated successfully.") {
              location.reload();
            }
            console.log("Success: " + data);
            statusCell.textContent = newStatus;
          })
          .catch((error) => console.error("Error:", error));
      });
    });
  });
}

window.attachEditButtonListeners = attachEditButtonListeners;
