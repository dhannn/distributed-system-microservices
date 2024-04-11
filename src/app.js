const express = require("express");
const path = require("path");
process.env.LOG_DIRECTORY = "root/log_files/Transaction.log";
const TransactionManager = require("../transaction-manager/index.js");
const tm = new TransactionManager();

const app = express();

app.use(express.static(path.join(__dirname, "/")));
app.use("/", express.static(path.join(__dirname, "pages")));
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/index.html"));
});

app.post("/appts", async (req, res) => {
  try {
    const region = req.body.region;
    const appointment = await tm.addAppointment(region);
    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/report", async (_, res) => {
  try {
    const report = await tm.generateReport();
    res.json(report);
  } catch (error) {
    res.status(500).json(error);
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

app.put("/appts/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const newStatus = req.body.status;
    await tm.modifyStatus(id, newStatus);
    res.json({ message: "Appointment status updated successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
