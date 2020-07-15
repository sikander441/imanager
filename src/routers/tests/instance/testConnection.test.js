const request = require('supertest')
const  app = require('../../../../express')


const mockInstance = {
    host:'inedc05',
    linuxUser:'root',
    linxPassword:'infa@123',
    sshPort:22
}

const successURL = `/instances/testConnection?host=${mockInstance.host}&port=${mockInstance.sshPort}&linuxUser=${mockInstance.linuxUser}&linuxPassword=${mockInstance.linxPassword}`
const failedURL =  `/instances/testConnection?host=${mockInstance.host}&port=${mockInstance.sshPort}&linuxUser=${mockInstance.linuxUser}&linuxPassword=213`
const incompleteURL =  `/instances/testConnection?port=${mockInstance.sshPort}&linuxUser=${mockInstance.linuxUser}&linuxPassword=213`
test('Test Connection for an instance with correct details',async ()=>{
   
    const response = await request(app)
    .get(successURL)
    .expect(200)

    expect(response.body.status).toEqual("success")
    
})

test('Test Connection for an instance with in-correct details',async ()=>{
   
    const response = await request(app)
    .get(failedURL)
    .expect(200)

    expect(response.body.status).toEqual("failed")
    
})

test('Test Connection for an instance with Incomplete details',async ()=>{
   
    const response = await request(app)
    .get(incompleteURL)
    .expect(400)

    expect(response.body.status).toEqual("failed")
    
})