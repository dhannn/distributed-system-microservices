const express = require("express");
const path = require("path");
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
    const newAppointment = req.body;
    const appointment = await tm.addAppointment(newAppointment);
    res.status(201).json(appointment);
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
