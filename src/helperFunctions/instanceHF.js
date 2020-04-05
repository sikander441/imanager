node_ssh = require('node-ssh')
logger=require('../../logger')
instanceModel = require('../models/instance')
var xml2js = require('xml2js');
// --------Runs an SSH command, returns a Promise.
const runSSH = async (instance,CMD)=>{
logger.log('info','Running command: '+CMD)
  var config={
    host: instance.host,
    username: instance.linuxUser,
    password: instance.linuxPassword,
    port: instance.sshPort
};
try{
  await ssh.connect(config)
  var result = await ssh.execCommand(CMD)
  ssh.dispose()
  return result
}catch(err){
  throw err
}

}

checkServiceStatus =  async (instance, serviceName)=> {
  var index = instance.CatalogServices.findIndex(x => x.name == serviceName)
  if(index == -1)
   throw new Error('Service Not found in this domain')
  else{
    var CMD=instance.ihome + '/server/bin/infacmd.sh ping -dn '+instance.domainName+'|grep \"was successfully pinged\"';

    try{
        var result = await runSSH(instance,CMD)
        if(result.stderr){
         throw new Error(result.stderr)
        }
        else if(result.stdout){
         logger.log('info',`Service: ${serviceName} set to UP`)
         instance.CatalogServices[index].status='UP'
         return instance
       }
        else{
          logger.log('info',`status is set to down for service: ${serviceName} of instance ${instance.host}:${instance.port}` )
          instance.CatalogServices[index].status='DOWN'
          return instance
       }
    }catch(e){ throw e}

  }
}

extractCatalogServices = async (instance,result)=>
{
 if(result.includes("Command ran successfully."))
 {
   result=result.replace('Command ran successfully.','').trim()
   result=result.split(" ")
   result.forEach((item, i) => {
     item=item.trim()
     if( instance.CatalogServices.findIndex(x => x.name == item) == -1)
         instance.CatalogServices.push({name:item,status:"DOWN"})
   });

 }
 else {
   logger.log('warn','Error to fetch the list of catalog services'+result.substr(0,300))
 }

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

}


updateDomainInfo = async function(instance){

versionSubCommand = '\`'+instance.ihome+'/server/bin/infacmd.sh version | grep -i version\`'
domainsInfaSubCommand = '\`cat '+instance.ihome+'/domains.infa\`'
logDirectorySubCommand =  '\`'+instance.ihome+'/server/bin/infacmd.sh getSystemLogDirectory \`'
catalogServiceSubCommand = '\`'+instance.ihome+'/server/bin/infacmd.sh listServices -dn '+instance.domainName+' -un '+instance.instanceUser+' -pd '+instance.instancePassword+' -st LDM \`'
delimiter='\"XXFFHH\" '

var CMD='echo  '+versionSubCommand+delimiter+domainsInfaSubCommand+delimiter+logDirectorySubCommand+delimiter+catalogServiceSubCommand

  try{
      var result = await runSSH(instance,CMD)
      if(result.stderr)
      {
        throw new Error(result.stderr)
      }
      else if(result.stdout)
      {
        logger.log('info','Command ran successfully')
        result=result.stdout.split('XXFFHH')
        instance.version=result[0].split(':')[1].trim()
        await Promise.all([
                          extractNodeInfo(instance,result[1]),
                          extractSystemLogDirectory(instance,result[2]),
                          extractCatalogServices(instance,result[3])
                        ])
        return instance;
        logger.log('info','Domain info updated')
      }
}catch(e){throw e}

}


const updateStatus = async function(instance,res){

 var CMD=instance.ihome + '/server/bin/infacmd.sh ping -dn '+instance.domainName+'|grep \"was successfully pinged\"';

 try{
     var result = await runSSH(instance,CMD)
     if(result.stderr){
      throw new Error(result.stderr)
     }
     else if(result.stdout){
      logger.log('info','status is set to UP')
      instance.status='UP'
      return instance
    }
     else{
       logger.log('info','status is set to down for instance: '+`${instance.ihome} ,${instance.host} ,${instance.port}` )
       instance.status="DOWN"
       return instance
    }
 }catch(e){ throw e}

}


const getLogs = async (instance,CMD) =>{

  try{
      var result = await runSSH(instance,CMD)
      if(result.stdout){
        logger.log('info','Logs fetched successfully')
        return result.stdout
      }
      else
       {
         logger.log('error',new Error(result.stderr));
         throw new Error(result.stderr)
       }
  }catch(e)
  {
    throw e
  }

  }



bringUp =async function(instance,res){
 var CMD=instance.ihome + '/tomcat/bin/infaservice.sh startup';

 try{

     var result = runSSH(instance,CMD)
     if(result.stderr)
     {
       throw new Error(result.stderr)
     }
     else{
       logger.log('info','Command ran succesfully')
   }

 }catch(e){ throw e }

}


module.exports = {
  getLogs,
  updateStatus,
  updateDomainInfo,
  bringUp,
  runSSH,
  checkServiceStatus
};
