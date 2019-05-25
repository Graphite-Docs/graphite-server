const mongoose = require('mongoose');
const fileModel = require('../../../models/fileModel');
const orgModel = require('../../../models/orgModel');
require('dotenv').config()
const uri = process.env.MONGO_URI_PRO_ACCOUNTS_DEV;
//mongoose.connect(uri, {useNewUrlParser: true});

module.exports = {
    deleteFromTeam: function(data) {
        let success = {};
        const mongoResponse = new Promise(async (resolve, reject) => {
            //mongoose.connect(uri, {useNewUrlParser: true});
            var db = mongoose.connection;
            db.on('error', console.error.bind(console, 'connection error:'));
            db.once('open', async function() {
                //Need to first verify that the requesting user is an admin or manager on team
            let doc = await orgModel.findOne({ orgId: data.orgId });
            console.log(doc.teams);
            if(!doc) {
                success = {
                    success: false, 
                    message: "Couldn't find org data"
                }
                resolve(success);
            } else {
                let teams = doc.teams;
                let thisTeam = teams.filter(a => a.id === data.teamId)[0];
                let users = thisTeam.users;
                let thisUser = users.filter(a => a.username === data.requestingUser)[0];
                let canDelete = thisUser.role === "Admin" || thisUser.role === "Manager" ? true : false;
                if(canDelete === true) {
                    const index = await users.map((x) => {return x.id }).indexOf(data.userId);
                    users.splice(index, 1);
                    thisTeam.users = users;
                    doc.teams = teams;
                    orgModel.update({orgId: data.orgId}, { $set: {teams: doc.teams} }, function(err, res){
                        if(err) {
                            console.log(err);
                            success = {
                                success: false, 
                                message: err
                            }
                            resolve(success);
                        } else {
                            console.log(res);
                            success = {
                                success: true,
                                message: "User delete from team"
                            }
                            resolve(success);
                        }
                    });
                } else {
                    success = {
                        success: false,
                        message: "User cannot delete"
                    }
                    resolve(success);
                }
            }
            });
        });
        return mongoResponse.then((success) => {
            //mongoose.disconnect();
            console.log(success);
            return success;
        });
    },
    deleteFromOrg: function(data) {
        console.log(data);
        let success = {};
        let doc;
        const mongoResponse = new Promise(async (resolve, reject) => {
            //mongoose.connect(uri, {useNewUrlParser: true});
            var db = mongoose.connection;
            db.on('error', console.error.bind(console, 'connection error:'));
            db.once('open', async function() {
                //Need to first verify that the requesting user is an admin or manager on team
            doc = await orgModel.findOne({ orgId: data.orgId });
            
            if(!doc) {
                success = {
                    success: false, 
                    message: "Couldn't find org data"
                }
                resolve(success);
            } else {
                let teams = doc.teams;
                for (const team of teams) {
                    let users = team.users;
                    let thisUser = users.filter(a => a.username === data.requestingUser)[0];
                    
                    let canDelete = thisUser.role === "Admin" || thisUser.role === "Manager" ? true : false;
                    if(canDelete === true) {
                        const index = await users.map((x) => {return x.id }).indexOf(data.userId);
                        if(index > -1) {
                            users.splice(index, 1);
                            team.users = users;
                            doc.teams = teams;
                            await orgModel.update({orgId: data.orgId}, { $set: {teams: doc.teams} }, function(err, res){
                                if(err) {
                                    console.log(err);
                                    success = {
                                        success: false, 
                                        message: err
                                    }
                                    resolve(success);
                                } else {
                                    console.log(res);
                                }
                            });
                        }
                    } else {
                        console.log("Trouble deleting user from team")
                    }
                }

                let mainUsers = doc.users;
                const userIndex = await mainUsers.map((x) => {return x.id }).indexOf(data.userId);
                mainUsers.splice(userIndex, 1);
                doc.users = mainUsers;
                orgModel.update({orgId: data.orgId}, { $set: {users: doc.users} }, function(err, res){
                    if(err) {
                        console.log(err);
                        success = {
                            success: false, 
                            message: err
                        }
                        resolve(success);
                    } else {
                        console.log(res);
                        success = {
                            success: true,
                            message: "User delete from org"
                        }
                        resolve(success);
                    }
                });
            }
            });
        });
        return mongoResponse.then((success) => {
            //mongoose.disconnect();
            console.log(success);
            return success;
        });
    }
}