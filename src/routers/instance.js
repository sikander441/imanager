const app=require('express')
const instanceModel = require('../models/instance')
const logger=require('../../logger')
const ihf = require('../helperFunctions/instanceHF')
node_ssh = require('node-ssh')
ssh = new node_ssh()


const serviceRouter = require('./services')


const router=app.Router();




router.use('/services',serviceRouter)
router.get('/testConnection',async (req,res) =>{

  const host=req.query.host
  const sshPort=req.query.port || 22
  const linuxUser = req.query.linuxUser;
  const linuxPassword = req.query.linuxPassword
  const instance={host,sshPort,linuxUser,linuxPassword}
  try{
    const result = await ihf.runSSH(instance,'ls ~')
    if(result.stderr)
     throw new Error(result.stderr)
    res.status(200).send({
      status:'success',
      message:'Test Connection successful!'
    })
  }catch(e)
  {
    logger.log('error',e)
    return res.status(202).send({status:'failed',message:'Something went wrong: '+e.message})
  }

})
router.get('/shutdown',async (req,res) =>{
  const _id=req.query.id
  try{
    var instance = await instanceModel.findWithId(_id)
  }catch(e){
    logger.log('error',e)
    return res.status(400).send('Something went wrong: '+e.message)
  }
  var CMD=instance.ihome + '/tomcat/bin/infaservice.sh shutdown';
  try{
    var result = await ihf.runSSH(instance,CMD)
    if(result.stderr)
    {
      throw new Error(result.stderr)
    }
    else{
      res.status(200).send(result.stdout+" You can check the logs now")
    }
  }catch(e){
    logger.log('error',e)
    res.status(400).send('Something went wrong: '+e.message)
  }
})

router.get('/startup/:id',async (req,res) =>{

  const _id=req.params.id
  try{
    var instance = await instanceModel.findWithId(_id)
  }catch(e){
    logger.log('error',e)
    return res.status(400).send('Something went wrong: '+e.message)
  }

 try{
   await ihf.bringUp(instance);
   res.send('The node is starting up, you can check the logs')
 }catch(e){
   logger.log('error',e)
   res.status(400).send('Something went wrong: '+e.message)
 }

})


router.get('/refreshDomain/:id',async (req,res)=> {
  const _id=req.params.id
  try{
    var instance = await instanceModel.findWithId(_id)
  }catch(e){
    logger.log('error',e)
    return res.status(400).send('Something went wrong: '+e.message)
  }
 try{
   var instance = await ihf.updateDomainInfo(instance);
   res.status(200).send(instance)
   await instance.save()
 }catch(e){
   logger.log('error',e)
   res.status(400).send('Something went Wrong: '+e.message)
 }


})

router.delete('/',async (req,res) => {
  const _id=req.query.id
  try{
    var instance = await instanceModel.findOneAndDelete({_id})
    if(!instance)
     throw new Error('Instance not found');
    logger.log('info',`Deleted instance: ${instance.host} with ihome: ${instance.ihome}`)
    res.status(200).send('Deleted Succesfully: '+instance)
  }
  catch(e)
  {
    logger.log('info',e)
    return res.status(400).send('Failed to get instances: '+e)
  }

})
router.patch('/',async (req,res) => {
  try{
    var _id = req.query._id
    delete req.query._id
    var instance = await instanceModel.findByIdAndUpdate({_id},req.query)
    if(instance)
      res.send('Updated succesfully')
    else
      throw new Error('No instance found with given id')
  }catch(e){
    logger.log('error',e)
    res.status(400).send('Something went wrong: '+e.message)
  }
})
router.get('/' , async (req,res) => {
  if(req.query.fieldsToReturn)
   var selectFields =req.query.fieldsToReturn

   req.app.io.emit('updateReceived',{msg:'testing'})

  try{
    if(selectFields){
      delete req.query.fieldsToReturn
      selectFields=selectFields.split(' ')
    }
    var instances = await instanceModel.find(req.query,selectFields)
  }
  catch(e)
  {
    logger.log('info',e)
    return res.status(400).send('Failed to get instances: '+e.message)
  }
  response = {'count':await instances.length}
  response.data = instances
  res.status(200).send(response)
})



router.get('/isUp/:id',async (req,res) => {
  const _id=req.params.id
  try{
    var instance = await instanceModel.findWithId(_id)
  }catch(e){
    logger.log('error',e)
    return res.status(400).send('Something went wrong: '+e.message)
  }

  try{
    var instance = await ihf.updateStatus(instance);
    res.status(200).send(instance.status)
    await instance.save()
  }catch(e)
  {
    logger.log('error',e)
    res.status(400).send('Something went wrong while checking node status: '+e.message)
  }

})


router.get('/getLogs/:id/:logType/:len?', async (req,res) => {

  const _id=req.params.id
  const logType=req.params.logType
  var len=req.params.len || 50;
  len=len>800?800:len
  try{
    var instance = await instanceModel.findWithId(_id)
  }catch(e){
    logger.log('error',e)
    return res.status(400).send('Something went wrong: '+e.message)
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
 try{
   var result = await ihf.runSSH(instance,CMD)
   res.write(result.stdout)
   res.write(result.stderr)
   res.end()
 }catch(e){
   logger.log('error',e)
   res.status(400).send('Some error occurred: '+e.message)
 }
})



router.post('/', async (req,res) => {

   var instance =  new instanceModel(req.body)
   if(instance.ihome.endsWith('/'))
    instance.ihome = instance.ihome.substring(0, instance.ihome.length - 1);


  try{
    domainsInfaSubCommand = 'cat '+instance.ihome+'/domains.infa'
    const xmlData = await ihf.runSSH(instance,domainsInfaSubCommand)
    await ihf.extractDomainInfo(instance,xmlData)
    var instancePresent = await instanceModel.find({ihome:instance.ihome,host:instance.host})
    if(instancePresent.length > 0)
    {
      logger.warn('Instance already exists')
      throw new Error('Instance already exists with id: '+instancePresent[0]._id)
    }else{
      instance = await ihf.updateDomainInfo(instance);
      res.send({status:'success',instance:await instance.save()})
    }
  }
 catch(e)
 {
   logger.log('error',e)
   return res.status(202).send({status:'fail',message:e.message})
 }

 logger.log('info','Saved instance succesfully '+instance)

})

router.post('/runSSH', async (req , res) =>{
  var CMD = req.body.cmd
  const _id=req.body.id
  try{
    var instance = await instanceModel.findWithId(_id)
  }catch(e){
    logger.log('error',e)
    return res.status(400).send('Something went wrong: '+e.message)
  }
  var result = await ihf.runSSH(instance,CMD)
  res.write(result.stdout)
  res.write(result.stderr)
  res.end()
})



module.exports = router;
