const express=require('express')
const bodyParser = require("body-parser");
var morgan = require('morgan')
var fs = require('fs')
var path = require('path')
var cors = require('cors')


const app=express();

var accessLogStream = fs.createWriteStream(path.join(__dirname, '/logs/access.log'), { flags: 'a' })
app.use(morgan('combined', { stream: accessLogStream }))

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use((cli, res, next) => {
    res.setHeader('Allow', "*")
    res.setHeader('Connection', "keep-alive")
    res.setHeader("Date", Date())
    res.setHeader("Content-Type", "application/json; charset=utf-8")
    res.setHeader('Access-Control-Allow-Origin', "*")
    res.setHeader('Allow-Control-Allow-Methods', "*")
    res.setHeader('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept")

    next()
})

module.exports = app
