const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const router = require('./route/route');
const multer = require('multer');
require('dotenv').config();

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer().any());

mongoose.connect(process.env.MONGO_DB_CLUSTER).then(() => {
    console.log("MongoDB connected");
}).catch((error) => {
    console.log(error.message)
});

app.use('/', router);

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on PORT ${process.env.PORT || 3000}`)
}); 