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


instanceSchema.methods.updateSystemLogDirectory = async function()
{

  var instance = this
  var config={
    host: instance.host,
    username: instance.linuxUser,
    password: instance.linuxPassword,
    port: instance.sshPort
 };

 var CMD=this.ihome + '/server/bin/infacmd.sh getSystemLogDirectory';
 try{

 ssh.connect(config).then(function(){
   ssh.execCommand(CMD).then(async function(result){
     instance.logDirectory=result.stdout.split('\n')[0]
     await instance.save()
     // ssh.dispose()
   }).catch((err)=>{console.log(err);logger.log('error',err)})
 }).catch((err)=>{console.log(err);logger.log('error',err)})

 }catch(e)
 {
 logger.log('error','Something went wrong, please refresh'+e)

 }
}
instanceSchema.methods.bringUp = async function(){
  var instance = this
  var config={
    host: instance.host,
    username: instance.linuxUser,
    password: instance.linuxPassword,
    port: instance.sshPort
 };

 var CMD=this.ihome + '/tomcat/bin/infaservice.sh startup';
 try{

 ssh.connect(config).then(function(){
   ssh.execCommand(CMD).then(async function(result){
     logger.log('info',result.stdout || result.stderr)
     // ssh.dispose();
   }).catch((err)=>logger.log('error',err))
 }).catch((err)=>logger.log('error',err))

 }catch(e)
 {
logger.log('error','Something went wrong, please refresh'+e)
 }

}
instanceSchema.methods.getVersion = async function(){
  var instance = this
  var config={
    host: instance.host,
    username: instance.linuxUser,
    password: instance.linuxPassword,
    port: instance.sshPort
 };

 var CMD=this.ihome + '/server/bin/infacmd.sh version | grep -i version';
 try{

 ssh.connect(config).then(function(){
   ssh.execCommand(CMD).then(async function(result){
    instance.version=result.stdout.split(':')[1]
    await instance.save();
    // ssh.dispose()
   }).catch((err)=>logger.log('error',err))
 }).catch((err)=>logger.log('error',err))

 }catch(e)
 {
logger.log('error','Something went wrong, please refresh'+e)
 }

}
instanceSchema.methods.updateStatus = async function(){
  var instance = this
  var config={
    host: instance.host,
    username: instance.linuxUser,
    password: instance.linuxPassword,
    port: instance.sshPort
 };

 var CMD=this.ihome + '/server/bin/infacmd.sh ping -dn '+this.domainName+'|grep \"was successfully pinged\"';
 try{

 ssh.connect(config).then(function(){
   ssh.execCommand(CMD).then(async function(result){
     if(result.stderr)
       logger.log('error',result.stderr)
     else if(result.stdout){
      logger.log('info','status is set to UP')
      instance.status="UP"
    }
     else{
       logger.log('info','status is set to down for instance: '+instance)
      instance.status="DOWN"
    }
    await instance.save();
    // ssh.dispose()
   }).catch((err)=>logger.log('error',err))
 }).catch((err)=>logger.log('error',err))

 }catch(e)
 {
logger.log('error','Something went wrong, please refresh'+e)
 }

}

instanceSchema.methods.updateDomainInfo = async function(){

 var instance = this
 var config={
   host: instance.host,
   username: instance.linuxUser,
   password: instance.linuxPassword,
   port: instance.sshPort
};

var CMD='cat '+instance.ihome+'/domains.infa'
try{

ssh.connect(config).then(function(){
  ssh.execCommand(CMD).then(function(result){
    if(result.stdout){

    xmlData=result.stdout
    parseString(xmlData, async function (err, result) {
      if(!instance.isDocker)
      {
        instance.host=result.Portals.vector[0].address[0].host[0]
        instance.port=result.Portals.vector[0].address[0].port[0]
      }
      instance.domainName=result.Portals.vector[0].domainName[0]
      await instance.save();
   });

   }
    else
     {logger.log('error','Something went wrong, please refresh'+result.stderr)}
     // ssh.dispose()
  }).catch( (err)=>{logger.log('error',err)})
}).catch((err)=>logger.log('error',err))

}catch(e)
{
logger.log('error','Something went wrong, please refresh'+e)
}


}

var instance = mongoose.model('instances',instanceSchema)

module.exports = instance
