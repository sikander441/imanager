const mongoose = require('mongoose')
const Schema= mongoose.Schema;


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
        type:String,
        required:true,
    },
    version:  {
        type:String,
        default:'0.0.0'
    },
},
{
 timestamps:true
})

var instance = mongoose.model('instances',instanceSchema)

module.exports = instance
