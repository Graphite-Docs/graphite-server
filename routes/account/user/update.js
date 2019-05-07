const MongoClient = require('mongodb').MongoClient;
const mongoose = require('mongoose');
const orgModel = require('../../../models/orgModel');
const userModel = require('../../../models/userModel');
const update = require('immutability-helper');
require('dotenv').config()
const uri = process.env.MONGO_URI_PRO_ACCOUNTS_DEV;
//const audits = require('../../audit/org/new');

module.exports = {
    updateOrgName: function(data, token) {
        const mongoResponse = new Promise((resolve, reject) => {
            MongoClient.connect(uri, {useNewUrlParser: true}, function(err, client) {
                if(err) {
                    success = {
                        success: false, 
                        message: "Error occurred while connecting to DB...\n"
                    };
                    resolve(success);
                } else {
                    console.log('Connected...');
                    const collection = client.db("graphite-docs-pro-accounts").collection("users");
                    // Perform actions on the collection object
                    collection.updateOne({"accountProfile.profile.username": token.claim.username}, {$set: {"accountProfile.orgInfo.name": data.orgName}}, function(err, res) {
                        if(err) {
                            success = {
                                success: false, 
                                message: "Error",
                                data: err
                            }
                            resolve(success);
                            client.close();
                            // const auditDetails = {
                            //     username: token.claim.username, 
                            //     date: new Date(), 
                            //     actions: "Updated org name", 
                            //     data: data.orgName
                            // }
                            //audits.postAudit(auditDetails);
                        } else {
                            success = {
                                success: true, 
                                data: res
                            }
                            resolve(success);
                            client.close();
                        }
                    })
                }
             });
        });
        return mongoResponse.then((success) => {
            console.log(success);
            return success;
        })
    }, 
    updateTeamMembership: function(data, token) {
        console.log("updating team membership")
        const teamObj = {
            teamId: data.team.id,
            name: data.team.name,
        }
        const mongoResponse = new Promise((resolve, reject) => {
            MongoClient.connect(uri, {useNewUrlParser: true}, function(err, client) {
                if(err) {
                    success = {
                        success: false, 
                        message: "Error occurred while connecting to DB...\n"
                    };
                    resolve(success);
                } else {
                    console.log('Connected...');
                    const collection = client.db("graphite-docs-pro-accounts").collection("users");
                    // Perform actions on the collection object
                    collection.updateOne({"accountProfile.profile.username": token.claim.username}, {$push: {"accountProfile.membershipTeams": teamObj}}, function(err, res) {
                        if(err) {
                            success = {
                                success: false, 
                                message: "Error",
                                data: err
                            }
                            resolve(success);
                            client.close();
                            const auditDetails = {
                                username: token.claim.username, 
                                date: new Date(), 
                                actions: "Updated team membership", 
                                data: data
                            }
                            //audits.postAudit(auditDetails);
                        } else {
                            success = {
                                success: true, 
                                data: res
                            }
                            resolve(success);
                            client.close();
                        }
                    })
                }
             });
        });
        return mongoResponse.then((success) => {
            console.log(success);
            return success;
        })
    }, 
    updateUserAccount: function(payload) {
        console.log("creating user within team...");
        let teams;
        let users;
        let success = {};
        const mongoResponse = new Promise((resolve, reject) => {
            mongoose.connect(uri, {useNewUrlParser: true});
            var db = mongoose.connection;
            db.on('error', console.error.bind(console, 'connection error:'));
            db.once('open', async function() {
                await orgModel.find({ orgId: payload.data.orgId }, async function(err, docs) {
                    if(err) {
                        console.log(err);
                    } else {
                        if(docs.length > 0) {
                            users = docs[0].users;
                            const usersIndex = await users.map(x => {return x.id}).indexOf(payload.data.id);
                            let thisUser = users[usersIndex];
                            thisUser["username"] = payload.data.username;
                            await orgModel.update({orgId: payload.data.orgId}, { $set: {users: users} }, function(err, res){
                                if(err) {
                                    success = {
                                        success: false, 
                                        data: err
                                    }
                                    resolve(success);
                                }
                            });
                            teams = docs[0].teams;
                            if(teams.length > 0) {
                                const teamIndex = await teams.map(x => {return x.id}).indexOf(payload.data.selectedTeam);
                                let thisTeam = teams[teamIndex];
                                
                                let teamUsers = thisTeam.users;
                                const teamUserIndex = await teamUsers.map(x => {return x.id}).indexOf(payload.data.id);
                                let thisTeamUser = teamUsers[teamUserIndex];
                                thisTeamUser["username"] = payload.data.username
                                thisTeamUser["invitePending"] = false;
                                await orgModel.update({orgId: payload.data.orgId}, { $set: {teams: teams} }, function(err, res){
                                    if(err) {
                                        success = {
                                            success: false, 
                                            data: err
                                        }
                                        resolve(success);
                                    } else {
                                        success = {
                                            success: true, 
                                            message: "User added"
                                        }
                                        resolve(success);
                                    }
                                })
                            } else {
                                console.log("Error with teams")
                            }
                        } else {
                            console.log("No data found")
                            success = {
                                success: false, 
                                message: "No data found"
                            }
                        }
                    }
                })
            });
        })

        return mongoResponse.then((success) => {
            console.log(success);
            return success;
        })
    }
}