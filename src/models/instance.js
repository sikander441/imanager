const mongoose = require('mongoose')
const Schema= mongoose.Schema;
const logger=require('../../logger.js')

var instanceSchema=new Schema({
    CatalogServices:{
      type:[{
        name:String,
        status:String,
        url:String,
      }
      ],
    },
    nodes:[String],
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
    },
    owner:{
      type:mongoose.ObjectId,
      ref:"users"
    }
},
{
 timestamps:true
})

instanceSchema.statics.findWithId = async function(_id){
  instanceModel = this
  try{
  var instance = await instanceModel.findById({_id})
  if(!instance)throw new Error('No instance with the ID found')
  return instance
  }catch(e){
  logger.log('error',e)
  throw e
  }
}

var instance = mongoose.model('instances',instanceSchema)

module.exports = instance
