const app=require('express')
const instanceModel = require('../models/instance')
const logger=require('../../logger')
const ihf = require('../helperFunctions/instanceHF')
node_ssh = require('node-ssh')
const teamsModel = require('../models/teams')
const {userModel} = require('../models/users')
const auth = require('../middleware/auth')

const controller = require('../controllers/instance/instanceController')

const serviceRouter = require('./services')
const e = require('express')


const router=app.Router();




router.use('/services',serviceRouter)
router.get('/testConnection',async (req,res) =>{
  try{
    const response = await controller.testConnection(req.query);
    if(response.status == 'success')
     res.status(200).send({status:'success'})
    else{
      throw response.error
    }
  }catch(e){
    if(e.code == 'CMDERR' ){
     res.status(200).send({status:'success'})
  }else if(e.code == 'INPUTERR'){
    res.status(400).send({status:'failed'})
   }
   else{
     res.status(200).send({status:'failed'})
   }
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

router.delete('/',auth,async (req,res) => {
  const _id=req.query.id
  let user = await userModel.findById(req.user._id);
  user = await user.populate('team').execPopulate();
  const teamName = user.team.teamName
 
  if( !_id )
   res.status(400).send('Sorry please give instance id ');
  try{
    var instance = await instanceModel.findOne({_id})
    if(!instance)
    throw new Error('Instance not found');
    
    await user.deleteInstanceWithId(instance._id)
    await teamsModel.deleteInstanceWithId(instance._id,teamName);
   
    var instance = await instanceModel.findOneAndDelete({_id})
    
    logger.log('info',`Deleted instance: ${instance.host} with ihome: ${instance.ihome}`)
    res.status(200).send('Deleted Succesfully: '+instance)
  }
  catch(e)
  {
    logger.log('info',e)
    console.log(e)
    return res.status(400).send('Failed  while deleting instance: '+e)
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
  try{
    const response = await controller.getAllInstances(req.query)
    res.send(response)
  }catch(ex){
    logger.log('error',ex)
    res.status(400).send({status:'failed',message:ex.message})
  }
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



router.post('/',auth, async (req,res) => {

   var instance =  new instanceModel(req.body)
   if(instance.ihome.endsWith('/'))
    instance.ihome = instance.ihome.substring(0, instance.ihome.length - 1);


  try{
    domainsInfaSubCommand = 'cat '+instance.ihome+'/isp/config/nodemeta.xml'
    const xmlData = await ihf.runSSH(instance,domainsInfaSubCommand)
    await ihf.extractDomainInfo(instance,xmlData)
    var instancePresent = await instanceModel.find({ihome:instance.ihome,host:instance.host})
    if(instancePresent.length > 0)
    {
      logger.warn('Instance already exists')
      throw new Error('Instance already exists with id: '+instancePresent[0]._id)
    }else{
      instance = await ihf.updateDomainInfo(instance);

      let user = await userModel.findById(req.user._id);
      user = await user.populate('team').execPopulate();
      user.instances.push(instance._id)

      let team = await teamsModel.findById(user.team._id)
      team.instances.push(instance._id)
      
      await user.save();
      await team.save();
      instance = await instance.save()

      res.send({status:'success',instance})
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
  try{
    var result = await ihf.runSSH(instance,CMD)
    res.write(result.stdout)
    res.write(result.stderr)
    res.end()
  }catch(err){
    res.write(err.message)
    res.end()
  }
    
  
 
  
})



module.exports = router;
