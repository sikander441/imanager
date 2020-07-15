const request = require('supertest')
const  app = require('../../../../express')


const expectedObject = {
    count:expect.any(Number),
    data:expect.any(Array)
}

const selectedFields = {
    _id:expect.any(String),
    host:expect.any(String),
    port:expect.any(Number),
    version:expect.any(String)
}


test('Get all instances with all information',async ()=>{
    const response = await request(app)
    .get('/instances/')
    .expect(200)
     
    expect(response.body).toMatchObject(expectedObject)
    expect(response.body.data).toEqual(expect.arrayContaining([expect.any(Object)]))
    expect(response.body.data).toHaveLength(response.body.count)

})

test('Get all instances with only host,port,version field fields',async () => {
    const response = await request(app)
    .get('/instances?fieldsToReturn=host port version  ')
    .expect(200)
    expect(response.body).toMatchObject(expectedObject)
    response.body.data.forEach(instance => {
        expect(instance).toEqual(selectedFields)
    });
   
})

test('Get Instances matching a specific field with only host,port,version field fields',async () => {
    const response = await request(app)
    .get('/instances?host=inglxbdm04.informatica.com&fieldsToReturn=host port version  ')
    .expect(200)
    expect(response.body).toMatchObject(expectedObject)
    response.body.data.forEach(instance => {
        expect(instance).toEqual(selectedFields)
        expect(instance.host).toEqual("inglxbdm04.informatica.com")
    });
   
})
