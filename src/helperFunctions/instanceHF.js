node_ssh = require('node-ssh')
logger=require('../../logger')
instanceModel = require('../models/instance')
var xml2js = require('xml2js');
node_ssh = require('node-ssh')

// --------Runs an SSH command, returns a Promise.

const runSSH = async (instance,CMD)=>{
logger.log('info','Running command: '+CMD)
  var config={
    host: instance.host,
    username: instance.linuxUser,
    password: instance.linuxPassword,
    port: instance.sshPort
};
var ssh = new node_ssh();
try{
  await ssh.connect(config)
  var result = await ssh.execCommand(CMD)
  if(result.stderr)
   {
     throw new Error(result.stderr)
   }
  ssh.dispose()
  return result
}catch(err){
  throw err
}

}
getProcessOptions = async (instance,index,result) =>{
  if(result.stderr){
    logger.log('warn','Error while fetching the Process options of Catalog Service '+result.stderr)
    throw new Error(result.stderr)
  }
 else{
   var https = result.stdout.split('\n')
   https = https[https.length-3].split('=')[1]
   var http = result.stdout.split('\n')
   http = http[http.length-4].split('=')[1]
   instance.CatalogServices[index].url = `${instance.host}:${https==0?http:https}/ldmadmin`
 }
}
checkServiceStatus =  async (instance, serviceName,force)=> {
  var index = instance.CatalogServices.findIndex(x => x.name == serviceName)
  if(index == -1)
   throw new Error('Service Not found in this domain')
  else{
    var CMD=instance.ihome + '/server/bin/infacmd.sh ping -dn '+instance.domainName+' -sn '+serviceName+'|grep \"was successfully pinged\"';
    var CMD2=instance.ihome + '/server/bin/infacmd.sh ldm listServiceProcessOptions -dn '+instance.domainName+' -sn '+serviceName+' -un \"'+instance.instanceUser+'\" -pd \"'+instance.instancePassword+'\" -nn '+instance.nodes[0]
    try{
        var result = await runSSH(instance,CMD)
        if(!instance.isDocker &&  (force || !instance.CatalogServices[index].url) )
        {
            var result2 = await runSSH(instance,CMD2)
            await getProcessOptions(instance,index,result2)
        }
        if(result.stderr){
         throw new Error(result.stderr)
        }
        else if(result.stdout){
         logger.log('info',`Status for service: ${serviceName} set to UP`)
         instance.CatalogServices[index].status='UP'
         return instance
       }
        else{
          logger.log('info',`status is set to down for service: ${serviceName} of instance ${instance.CatalogServices[index].url}` )
          instance.CatalogServices[index].status='DOWN'
       }
    }catch(e){ throw e}

  }
}

extractCatalogServices = async (instance,result)=>
{
     if(result.stderr)
      logger.log('warn','Error while fetching Catalog Services: '+result.stderr)
     else if(result.stdout.includes("Command ran successfully."))
     {
       result = result.stdout
       result=result.replace('Command ran successfully.','').trim()
       result=result.split(" ")
       result.forEach((item, i) => {
         item=item.trim()
         if(item=="")return
         if( instance.CatalogServices.findIndex(x => x.name == item) == -1)
             instance.CatalogServices.push({name:item,status:"DOWN"})
       });
     }
 else {
   logger.log('warn','Error to fetch the list of catalog services'+result.stdout.substr(0,300))
 }
}

extractDomainInfo = async function(instance,xmlData){
    if(xmlData.stderr){
     logger.log('warn','Error while fetching DomainInfo: '+xmlData.stderr)
     throw new Error(xmlData.stderr)
   }
    else{
      xmlData = xmlData.stdout
      var parser = new xml2js.Parser
      result= await parser.parseStringPromise(xmlData)
      
      if(!instance.isDocker)
      {
        instance.host=result['imx:IMX']['domainservice:GatewayNodeConfig'][0].address[0]['$'].host
        instance.port=result['imx:IMX']['domainservice:GatewayNodeConfig'][0].address[0]['$'].httpPort
      }
      instance.domainName=result['imx:IMX']['domainservice:GatewayNodeConfig'][0]['$'].domainName
    }


}

extractSystemLogDirectory = async function(instance,directory)
{
  if(directory.stderr){
   logger.log('warn','Error while fetching log directory: '+directory.stderr)
    throw new Error(directory.stderr)
 }
  else if(directory.stdout.includes("Command ran successfully."))
  {
    directory = directory.stdout
    directory=directory.replace('Command ran successfully.','').trim()
    instance.logDirectory=directory
  }
  else{
    logger.log('warn','Error to fetch the log directory'+directory.stdout.substr(0,300))
     throw new Error(directory.stdout.substr(0,300))
  }

}
extractVersionInfo = async(instance, result) =>{
  if( result.stderr ){
   logger.log('warn','Version command failed with error: '+result.stderr)
   throw new Error(result.stderr)
 }
  else {
    result = result.stdout
    instance.version=result.split(':')[1].trim()
  }
}
extractNodeNames = async(instance , result ) => {

  if(result.stderr){
     logger.log('warn','Failed to get node names: '+result.stderr)
     throw new Error(result.stderr)
  }
  else if(result.stdout.includes("Command ran successfully."))
  {
    result = result.stdout
    result=result.replace('Command ran successfully.','').trim()
    instance.nodes=result.split(' ')
  }
  else{
    logger.log('warn','Error to fetch the Node Names'+result.stdout.substr(0,300))
    throw new Error(result.stdout.substr(0,300))
  }
}

updateDomainInfo = async function(instance){

versionSubCommand = '\`'+instance.ihome+'/server/bin/infacmd.sh version | grep -i version\`'
domainsInfaSubCommand = '\`cat '+instance.ihome+'/isp/config/nodemeta.xml`'
logDirectorySubCommand =  '\`'+instance.ihome+'/server/bin/infacmd.sh getSystemLogDirectory \`'
catalogServiceSubCommand = '\`'+instance.ihome+'/server/bin/infacmd.sh listServices -dn '+instance.domainName+' -un '+instance.instanceUser+' -pd '+instance.instancePassword+' -st LDM \`'
getNodeListSubCommand = '\`'+instance.ihome+'/server/bin/infacmd.sh listNodes -dn '+instance.domainName+' -un '+instance.instanceUser+' -pd '+instance.instancePassword+'\`';
delimiter='\"XXFFHH\" '

var CMDS=['echo  '+versionSubCommand,'echo  '+domainsInfaSubCommand,'echo  '+logDirectorySubCommand,'echo '+catalogServiceSubCommand,'echo '+getNodeListSubCommand]
var result=[]
  try{
     for(i=0; i<CMDS.length;i++)
     {
       result.push(runSSH(instance,CMDS[i]))
     }
      res=await Promise.all(result)

      logger.log('info','Command ran successfully')
      await Promise.all([
                          extractNodeNames(instance,res[4]) ,
                          extractVersionInfo(instance,res[0]),
                          extractDomainInfo(instance,res[1]),
                          extractSystemLogDirectory(instance,res[2]),
                          extractCatalogServices(instance,res[3]),

                        ])
        return instance;
        logger.log('info','Domain info updated')

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
  updateStatus,
  updateDomainInfo,
  bringUp,
  runSSH,
  checkServiceStatus,
  extractDomainInfo
};
