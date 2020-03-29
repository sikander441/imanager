const app=require('express')
const instanceModel = require('../models/instance')
const logger=require('../../logger')
node_ssh = require('node-ssh')
ssh = new node_ssh()

const router=app.Router();

router.get('/startup/:id',async (req,res) =>{

  const _id=req.params.id
  try{
  var instance = await instanceModel.findById({_id})
  }catch(e){
  logger.log('error','No such instance found',e)
  return res.send('No such instance found,please check object id')
  }
  if(!instance){
   res.send('Error no instance found')
   return -1;
 }
  await instance.bringUp();
  res.send('check the logs, command ran')
})


router.get('/refreshDomain/:id',async (req,res)=> {
  const _id=req.params.id
  try{
  var instance = await instanceModel.findById({_id})
  }catch(e){
  logger.log('error','No such instance found',e)
  return res.send('No such instance found,please check object id')
  }
  if(!instance){
   res.send('Error no instance found')
   return -1;
 }

  await instance.updateSystemLogDirectory();
  await instance.updateStatus();
res.send(instance)

})
router.get('/' , async (req,res) => {

  try{
    var instances = await instanceModel.find({})
  }
  catch(e)
  {
    logger.log('warn','Failed to get instances',e)
    return res.status(400).send('Failed to get instances')
  }

  res.status(200).send(instances)
})



router.get('/isUp/:id',async (req,res) => {
  const _id=req.params.id
  try{
  var instance = await instanceModel.findById({_id})
  }catch(e){
  logger.log('error','No such instance found',e)
  return res.send('No such instance found,please check object id')
  }
  if(!instance){
   res.send('Error no instance found')
   return -1;
 }
  await instance.updateStatus();
  res.send(instance.status);

})


router.get('/getLogs/:id/:logType/:len?', async (req,res) => {
  const _id=req.params.id
  const logType=req.params.logType
  var len=req.params.len || 50;
  len=len>800?800:len
  try{
  var instance = await instanceModel.findById({_id})
}catch(e){
  logger.log('error','No such instance found',e)
  return res.send('No such instance found,please check object id')
}

 if(!instance){
  res.send('Error no instance found')
  return -1;
}
  logger.log('info','fetching Logs from instance:'+instance.host+'  Directory: '+instance.logDirectory)
  var config={
    host: instance.host,
    username: instance.linuxUser,
    password: instance.linuxPassword,
    port: instance.sshPort
};
if(logType == 'catalina')
 var CMD='tail -'+len+'  '+instance.logDirectory+'/catalina.out';
else if(logType == 'node')
 var CMD='tail -'+len+' '+ instance.logDirectory+'/node.log';
else
 console.log('here')

try{

ssh.connect(config).then(function(){
  ssh.execCommand(CMD).then(function(result){
    if(result.stdout){
    res.write(result.stdout)
    res.end()
   }
    else
     {logger.log('error',result.stderr);res.send('Something went wrong')}
     ssh.dispose()
  }).catch((err)=>logger.log('error',err))
}).catch((err)=>logger.log('error',err))

}catch(e)
{
  res.status(400).send('Something went wrong, please refresh.')
  logger.log('error','Something went wrong while fetching logs from server')
}



})

router.post('/',  async (req,res) => {

  var instance =  new instanceModel(req.body)

  try{
  var instance = await instance.save()
  }
 catch(e)
 {
   logger.log('error','Failed to save instance :'+e)
   return res.status(400).send(e.message)
 }

 res.status(200).send(instance)
 logger.log('info','Saved instance succesfully '+instance)


 await instance.updateDomainInfo();
 await instance.updateStatus();
 await instance.getVersion();
})



module.exports = router;
