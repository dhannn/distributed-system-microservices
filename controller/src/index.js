const express = require('express');
const TransactionManager = require('../../transaction-manager/index');
const transactions = new TransactionManager();

const app = express();


app.get('/appt', (req, res) => {
    const id = req.query['apptid'];
    transactions.viewAppointment(id)
        .then((data) => {
            res.status('200').send(data);
        }).catch((error) => {
            res.status('404').send(error);
        });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running locally on port ${PORT}`);
});
