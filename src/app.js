const express = require("express");
const path = require("path");
const TransactionManager = require("../transaction-manager/index.js");
const tm = new TransactionManager();

const app = express();

app.use(express.static(path.join(__dirname, "/")));
app.use("/", express.static(path.join(__dirname, "pages")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/index.html"));
});

app.get("/appts", async (req, res) => {
  try {
    const appointments = await tm.viewAppointments();
    console.log("Appointments:", appointments);
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/appts/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const appointment = await tm.viewAppointment(id);
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
