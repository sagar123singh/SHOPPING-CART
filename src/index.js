const express = require('express');
var bodyParser = require('body-parser');
const multer = require('multer');


const route = require('./route/route.js');

const app = express();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// app.use(upload.array()); 
// app.use(express.static('public'));

app.use(multer().any());



const mongoose = require('mongoose');

mongoose.connect("mongodb+srv://sagar123singh:ds@cluster0.oye0t.mongodb.net/group17Database?authSource=admin&replicaSet=atlas-gyucxl-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true",{useNewUrlParser:true})
.then(()=>console.log("MongoDb connected"))
.catch(err=>console.log(err))
app.use('/',route);


app.listen(process.env.PORT || 3000, function() {
	console.log('Express app running on port ' + (process.env.PORT || 3000))
});


