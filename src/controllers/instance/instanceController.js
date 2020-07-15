const instanceModle = require('../../models/instance')
const { response } = require('express')
const ihf = require('../../helperFunctions/instanceHF')

const getAllInstances = async (query) =>{
    if(query.fieldsToReturn)
        var selectFields =query.fieldsToReturn
  try{
    if(selectFields){
      delete query.fieldsToReturn
      selectFields=selectFields.split(' ')
    }
    var instances = await instanceModel.find(query,selectFields)
  }
  catch(e)
  {
   throw new Error('Failed to get Instances')
  }
  let response = {'count':await instances.length}
  response.data = instances
  return response;
}


const testConnection = async (query) => {
    
  const host=query.host
  const sshPort=query.port || 22
  const linuxUser =query.linuxUser;
  const linuxPassword =query.linuxPassword

  if(!host || !linuxUser || !linuxPassword)
   throw { code:'INPUTERR' }
  const instance={host,sshPort,linuxUser,linuxPassword}
  try{
    const result = await ihf.runSSH(instance,'ls ~')
    if(result.stderr)
     throw {code:'CMDERR',message:result.stderr}
    return {status:'success'}
  }catch(e)
  {
    return {status:'failed',error:e}
  }

}

module.exports = {
    getAllInstances,
    testConnection
}