const instanceModel = require('./instance');
const teamModel = require('./teams');

const mongoose = require('mongoose')
const db = require('../db/dbconnect')

printData = async () =>{
    let team = await teamModel.find({teamName:'DQ'})
    team = team[0]
    team.populate('instances').execPopulate( (err,team) => {
        console.log(team)
    })
}

generateData = async () => {
    const instances = await instanceModel.find({});

    const _team = {
        teamName:'EDC',
        username:'test',
        password:'test2',
        instances
    }

    var newTeam = new teamModel(_team)
    const team = await newTeam.save();
    
    console.log('done')
}
deleteInstance =async (_id) =>{

    let team = await (await teamModel.findOne({teamName:'DQ'})).populate('instances').execPopulate()
    console.log(team)
    const index = team.instances.map( _ => _._id ).indexOf(_id)
    console.log(index)

    if(index > -1 ){
        team.instances.splice(index,1)
    }
    else{
        throw new Error('No such instance found with id'+ _id)
    }
    await team.save();

}
db.openConnection();
mongoose.connection.on('connected',async () => {
    //generateData();
   // printData()
   const _id = "5ee36bcd5225c258101d223d"
   deleteInstance(_id);

})
