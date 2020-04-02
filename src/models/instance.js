const mongoose = require('mongoose')
const Schema= mongoose.Schema;
const logger=require('../../logger.js')
node_ssh = require('node-ssh')
var parseString = require('xml2js').parseString;

var instanceSchema=new Schema({
    ihome: {
        type:String,
        required:true,
    },
    host:  {
        type:String,
        required:true
    },
    port:  {
        type:Number,
        default:0000
    },
    version:  {
        type:String,
        default:'0.0.0'
    },
    sshPort:{
      type:Number,
      default:22
    },
    linuxUser:{
      type:'String',
      required:true
    },
    linuxPassword:{
      type:'String',
      required:true
    },
    logDirectory:{
      type:'String',
      default:'x/x/x/x'
    },
    domainName:{
      type:'String',
      default:'xxxxx'
    },
    instanceUser:{
      type:'String',
      required:true
    },
    instancePassword:{
      type:'String',
      required:true
    },
    status:{
      type:'String',
      default:'Down'
    },
    isDocker:{
      type:Boolean,
      default:false
    }
},
{
 timestamps:true
})



var instance = mongoose.model('instances',instanceSchema)

module.exports = instance
