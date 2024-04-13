const express = require("express");
const path = require("path");
process.env.LOG_DIRECTORY = "root/log_files/Transaction.log";
const TransactionManager = require("../transaction-manager/index.js");
const DBError = require("./error.js");
const tm = new TransactionManager();

const app = express();
/* const nodes = {
  luzon: "http://ccscloud.dlsu.edu.ph:20100",
  visayas: "http://ccscloud.dlsu.edu.ph:20101",
  mindanao: "http://ccscloud.dlsu.edu.ph:20101",
};

app.use((req, res, next) => {
  const region = req.body.region;
  if (region && nodes[region]) {
    // Check if the request is already on the correct node
    if (
      (region === "luzon" && process.env.NODE_IP === "10.2.0.100") ||
      ((region === "visayas" || region === "mindanao") && process.env.NODE_IP === "10.2.0.101")
    ) {
      next();
    } else if (process.env.NODE_IP === "10.2.0.99") {
      // If the current node is the central node, it can handle all requests
      next();
    } else {
      res.redirect(nodes[region] + req.originalUrl);
    }
  } else {
    next();
  }
}); */
app.use(express.static(path.join(__dirname, "/")));
app.use("/", express.static(path.join(__dirname, "pages")));
app.use(express.json());
DELAY = 2000
app.get("/", (req, res) => {
  try {
    res.sendFile(path.join(__dirname, "/index.html"));
  } catch (error) {
    console.error(err);
    res.status(500).json(error);
  }
});

app.post("/appts", async (req, res) => {
  try {
    const region = req.body.region;
    const appointment = await tm.addAppointment(region);
    setTimeout(
      () => res.status(201).json(appointment),
      DELAY
    )
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

app.get("/report", async (_, res) => {
  try {
    const report = await tm.generateReport();
    setTimeout(
      () => res.json(report),
      DELAY
    )
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // milliseconds

app.get("/appts/:id", async (req, res) => {
  let retries = 0;

  const handleConcurrentConflict = async () => {
    try {
      const id = req.params.id;
      const appointment = await tm.viewAppointment(id);
      setTimeout(
        () => res.json(appointment),
        DELAY
      );
    } catch (error) {
      if (error.code === DBError.CONCURRENCY_CONFLICT && retries < MAX_RETRIES) {
        // Retry after a delay
        setTimeout(() => {
          retries++;
          handleConcurrentConflict();
        }, RETRY_DELAY);
      } else {
        res.status(500).json(error);
      }
    }
  };

  handleConcurrentConflict();
});

app.put("/appts/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const newStatus = req.body.status;
    await tm.modifyStatus(id, newStatus);
    setTimeout(
      () => res.json({ message: "Appointment status updated successfully." }),
      DELAY
    )
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
