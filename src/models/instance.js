const mongoose = require('mongoose')
const Schema= mongoose.Schema;
const logger=require('../../logger.js')

var instanceSchema=new Schema({
    ihome: {
        type:String,
        required:true,
    },
    host:  {
        type:String,
        required:true,
    },
    port:  {
        type:Number,
        required:true,
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

    },
    linuxPassword:{
      type:'String'
    },
    logDirectory:{
      type:'String'
    }
},
{
 timestamps:true
})




var instance = mongoose.model('instances',instanceSchema)

module.exports = instance
