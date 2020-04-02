node_ssh = require('node-ssh')
logger=require('../../logger')
instanceModel = require('../models/instance')
var xml2js = require('xml2js');


extractCatalogServices = async (instance,result)=>
{
 if(result.includes("Command ran successfully."))
 {
   result=result.replace('Command ran successfully.','').trim()
   result=result.split(" ")
   instance.CatalogServices = result
 }
 else {
   logger.log('warn','Error to fetch the list of catalog services'+result.substr(0,300))
 }

return instance
}
extractNodeInfo = async function(instance,xmlData){

    var parser = new xml2js.Parser
    result= await parser.parseStringPromise(xmlData)
    if(!instance.isDocker)
    {
      instance.host=result.Portals.vector[0].address[0].host[0]
      instance.port=result.Portals.vector[0].address[0].port[0]
    }
    instance.domainName=result.Portals.vector[0].domainName[0]

    return instance;
}

extractSystemLogDirectory = async function(instance,directory)
{
  if(directory.includes("Command ran successfully."))
{
  directory=directory.replace('Command ran successfully.','').trim()
  instance.logDirectory=directory
}
else{
  logger.log('warn','Error to fetch the log directory'+directory.substr(0,300))

}
  return instance
}

updateDomainInfo = function(instance,res){


 var config={
   host: instance.host,
   username: instance.linuxUser,
   password: instance.linuxPassword,
   port: instance.sshPort
};

versionSubCommand = '\`'+instance.ihome+'/server/bin/infacmd.sh version | grep -i version\`'
domainsInfaSubCommand = '\`cat '+instance.ihome+'/domains.infa\`'
logDirectorySubCommand =  '\`'+instance.ihome+'/server/bin/infacmd.sh getSystemLogDirectory \`'
catalogServiceSubCommand = '\`'+instance.ihome+'/server/bin/infacmd.sh listServices -dn '+instance.domainName+' -un '+instance.instanceUser+' -pd '+instance.instancePassword+' -st LDM \`'
delimiter='\"XXFFHH\" '

var CMD='echo  '+versionSubCommand+delimiter+domainsInfaSubCommand+delimiter+logDirectorySubCommand+delimiter+catalogServiceSubCommand
logger.log('info','Running command: '+CMD)
  try{

    ssh.connect(config).then(async function(){
    await ssh.execCommand(CMD).then(async function(result){

      if(result.stderr)
      {
        logger.log('error',new Error(result.stderr))
        res.status(400).send('Something went wrong'+result.stderr)
      }
      else if(result.stdout){
        logger.log('info','Command ran successfully')
        result=result.stdout.split('XXFFHH')
        var version=result[0].split(':')[1]
        instance.version=version;
        instance = await extractNodeInfo(instance,result[1],res);
        instance = await extractSystemLogDirectory(instance,result[2],res)
        instance = await extractCatalogServices(instance,result[3],res)
        res.status(200).send(instance)
        logger.log('info','Domain info updated')
        instance.save();
      }
    })
  }).catch((err)=>{logger.log('error',err);res.status(400).send('Something went wrong,check logs')})

}catch(e)
    {
      logger.log('error',e)
      res.status(400).send('Something went wrong,check logs');
    }
}


const updateStatus = function(instance,res){
  var config={
    host: instance.host,
    username: instance.linuxUser,
    password: instance.linuxPassword,
    port: instance.sshPort
 };

 var CMD=instance.ihome + '/server/bin/infacmd.sh ping -dn '+instance.domainName+'|grep \"was successfully pinged\"';
 logger.log('info','Ran Command: '+CMD)
 try{
 ssh.connect(config).then(function(){
   ssh.execCommand(CMD).then(function(result){
     if(result.stderr){
       res.status(400).send('Something went wrong, please check the logs');
       logger.log('error',new Error(result.stderr))
     }
     else if(result.stdout){
      logger.log('info','status is set to UP')
      res.status(200).send('UP')
      instance.status="UP"
    }
     else{
       logger.log('info','status is set to down for instance: '+`${instance.ihome} ,${instance.host} ,${instance.port}` )
       res.status(200).send('DOWN');
       instance.status="DOWN"
    }
    instance.save();
  })
}).catch((err)=>{logger.log('error',err);res.status(400).send('Something went wrong, plesae check logs');})

 }catch(e)
 {
   res.status(400).send('Something went wrong, plesae check logs')
   logger.log('error',e)
 }

}


const getLogs = (instance,CMD,res) =>{
  var config={
    host: instance.host,
    username: instance.linuxUser,
    password: instance.linuxPassword,
    port: instance.sshPort
};

try{
ssh.connect(config).then(function(){
  ssh.execCommand(CMD).then(function(result){
    if(result.stdout){
    logger.log('info','Logs fetched successfully')
    res.write(result.stdout)
    res.end()
    ssh.dispose();
   }
    else
     {
       logger.log('error',new Error(result.stderr));res.send('Something went wrong')}
  })
}).catch((err)=>{logger.log('error',err);res.status(400).send('Error')})

}catch(e)
{
  logger.log('error','Something went wrong while fetching logs from server')
  res.status(400).send('Something went wrong, please refresh.')
}
}



bringUp = function(instance,res){
  var config={
    host: instance.host,
    username: instance.linuxUser,
    password: instance.linuxPassword,
    port: instance.sshPort
 };


 var CMD=instance.ihome + '/tomcat/bin/infaservice.sh startup';
 logger.log('info','Running command'+CMD)
 try{

 ssh.connect(config).then(function(){
   ssh.execCommand(CMD).then(async function(result){
     if(result.stderr)
     {
       logger.log('error',new Error(result.stderr))
       res.status(400).send('Something went wrong, please check logs')
     }
     else{
       logger.log('info','Command ran succesfully')
     res.status(200).send(result.stdout)
   }
   })
 }).catch((err)=>{logger.log('error',err);res.status(400).send('Something went wrong')})

 }catch(e)
 {
   logger.log('error',e)
   res.status(400).send('Something went wrong')
 }

}


module.exports = {
  getLogs,
  updateStatus,
  updateDomainInfo,
  bringUp
};
