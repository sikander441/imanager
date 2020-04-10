const app=require('express')
const instanceModel = require('../models/instance')
const logger=require('../../logger')
const ihf = require('../helperFunctions/instanceHF')
node_ssh = require('node-ssh')
ssh = new node_ssh()

const router=app.Router();



router.get('/toggleService', async(req,res) =>{
  res.send('Toggling')
})

router.get('/getLogs', async (req,res) => {
  const _id=req.query.id
  const CS = req.query.serviceName
  const logFile = req.query.file
  var len=req.query.len || 50;

  len=len>800?800:len

  try{
    var instance = await instanceModel.findWithId(_id)
  }catch(e){
    logger.log('error',e)
    return res.status(400).send('Something went wrong: '+e.message)
  }

   var CMD='tail -'+len+'  '+instance.logDirectory+'/services/CatalogService/'+CS+'/'+logFile;
  
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
router.get('/checkCatalogStatus',async (req,res) =>{
  const _id=req.query.id
  const serviceName=req.query.serviceName
  try{
    var instance = await instanceModel.findWithId(_id)
  }catch(e){
    logger.log('error',e)
    return res.status(400).send('Something went wrong: '+e.message)
  }


  try{
    await ihf.checkServiceStatus(instance,serviceName)
    var index = instance.CatalogServices.findIndex(x => x.name == serviceName)
    res.status(200).send(`Service ${serviceName} is set to ${instance.CatalogServices[index].status}`)
    await instance.save()
  }catch(e){
    logger.log('error',e)
    res.status(400).send('Something went wrong: '+e)
  }
})


router.get('/updateAllServices',async (req,res)=> {
  const _id=req.query.id
  try{
    var instance = await instanceModel.findWithId(_id)
  }catch(e){
    logger.log('error',e)
    return res.status(400).send('Something went wrong: '+e.message)
  }

  var resultSet = []
  try{
    for(var i=0 ; i<instance.CatalogServices.length ;i++ )
      {
        resultSet.push(ihf.checkServiceStatus(instance,instance.CatalogServices[i].name,true));
      }
      await Promise.all(resultSet)
      res.send(instance)

    }catch(e){
      logger.log('error',e)
      res.status(400).send('Something went wrong: '+e.message)
    }
    finally{

      await instance.save()
    }
})
module.exports = router
