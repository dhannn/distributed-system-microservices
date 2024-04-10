const express = require('express');
const TransactionManager = require('../../transaction-manager/index');
const transactions = new TransactionManager();

const app = express();


app.get('/appt', (req, res) => {
    const id = req.query['apptid'];
    transactions.viewAppointment(id)
        .then((data) => {
            res.status('200').send(data);
        })
});
