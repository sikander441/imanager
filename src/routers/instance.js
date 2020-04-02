const app=require('express')
const instanceModel = require('../models/instance')
const logger=require('../../logger')
const ihf = require('../helperFunctions/instanceHF')
node_ssh = require('node-ssh')
ssh = new node_ssh()

const router=app.Router();

router.get('/startup/:id',async (req,res) =>{

  const _id=req.params.id
  try{
  var instance = await instanceModel.findById({_id})
  }catch(e){
  logger.log('error','No such instance found',e)
  return res.status(404).send('No such instance found,please check object id')
  }
  if(!instance){
   logger.log('warn','Something went wrong while fetching the instance')
   return res.status(404).send('Error no instance found')
 }
  ihf.bringUp(instance,res);
})


router.get('/refreshDomain/:id',async (req,res)=> {
  const _id=req.params.id
  try{
  var instance = await instanceModel.findById({_id})
  }catch(e){
  logger.log('error',e)
  return res.status(404).send('No such instance found,please check object id')
  }
  if(!instance){
   return res.status(400).send('Error no instance found')
 }
ihf.updateDomainInfo(instance,res);


})


router.get('/' , async (req,res) => {
  try{
    var instances = await instanceModel.find({})
  }
  catch(e)
  {
    logger.log('info',e)
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

  ihf.updateStatus(instance,res);

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

if(logType == 'catalina')
 var CMD='tail -'+len+'  '+instance.logDirectory+'/catalina.out';
else if(logType == 'node')
 var CMD='tail -'+len+' '+ instance.logDirectory+'/node.log';
else
 {
   res.status(400).send('Option selected incorrect')
 }
ihf.getLogs(instance,CMD,res)
})



router.post('/',  async (req,res) => {
  var instance =  new instanceModel(req.body)
  try{
  var instance = await instance.save()
  }
 catch(e)
 {
   logger.log('error',e)
   return res.status(400).send(e.message)
 }

 res.status(200).send(instance)
 logger.log('info','Saved instance succesfully '+instance)

})



module.exports = router;
