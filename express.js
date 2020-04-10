const express=require('express')
const bodyParser = require("body-parser");
var morgan = require('morgan')
var fs = require('fs')
var path = require('path')



const app=express();

var accessLogStream = fs.createWriteStream(path.join(__dirname, '/logs/access.log'), { flags: 'a' })
app.use(morgan('short', { stream: accessLogStream }))

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

module.exports = app
