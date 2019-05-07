const MongoClient = require('mongodb').MongoClient;
const mongoose = require('mongoose');
require('dotenv').config()
const orgModel = require('../../../models/orgModel');
const uri = process.env.MONGO_URI_PRO_ACCOUNTS_DEV;
const user = require('../user/update');

module.exports = {
    updateOrgName: function(data, token) {
        let success = {};
        const mongoResponse = new Promise((resolve, reject) => {
            mongoose.connect(uri, {useNewUrlParser: true});
            var db = mongoose.connection;
            db.on('error', console.error.bind(console, 'connection error:'));
            db.once('open', function() {
                orgModel.findOneAndUpdate({orgId: data.orgId}, { name: data.orgName }, {new: true}, function(err, res){
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
                            message: "Org name updated"
                        }
                        resolve(success);
                    }
                })
            });
        });

        return mongoResponse.then((success) => {
            console.log(success);
            return success;
        })
    }, 
    postNewTeam: function(data, token) {
        let success = {};
        const mongoResponse = new Promise((resolve, reject) => {
            mongoose.connect(uri, {useNewUrlParser: true});
            var db = mongoose.connection;
            db.on('error', console.error.bind(console, 'connection error:'));
            db.once('open', function() {
                orgModel.update({orgId: data.orgId}, { $push: {teams: data.team} }, function(err, res){
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
                            message: "New team added"
                        }
                        resolve(success);
                    }
                })
            });
        });

        return mongoResponse.then((success) => {
            console.log(success);
            return success;
        })


        // const mongoResponse = new Promise((resolve, reject) => {
        //     MongoClient.connect(uri, {useNewUrlParser: true}, function(err, client) {
        //         if(err) {
        //             success = {
        //                 success: false, 
        //                 message: "Error occurred while connecting to DB...\n"
        //             };
        //             resolve(success);
        //         } else {
        //             console.log('Connected...');
        //             const collection = client.db("graphite-docs-pro-accounts").collection("organizations");
        //             // Perform actions on the collection object
        //             collection.updateOne({"orgProfile.orgId": data.orgId}, {$push: {"orgProfile.teams": data.team}}, function(err, res) {
        //                 if(err) {
        //                     success = {
        //                         success: false, 
        //                         message: "Error",
        //                         data: err
        //                     }
        //                     resolve(success);
        //                     client.close();
        //                 } else {
        //                     success = {
        //                         success: true, 
        //                         data: res
        //                     }
        //                     resolve(success);
        //                     client.close();
        //                     // const auditDetails = {
        //                     //     username: token.claim.username, 
        //                     //     date: new Date(), 
        //                     //     actions: "Added new team", 
        //                     //     data: data.team
        //                     // }
        //                     //audits.postAudit(auditDetails);
        //                 }
        //             })
        //         }
        //      });
        // });
        // return mongoResponse.then((success) => {
        //     console.log(success);
        //     return success;
        // })
    }, 
    updateUserTeam: function(data) {
        console.log(data.data);
        const teamObj = {
            id: data.data.id,
            username: data.data.username, 
            name: data.data.name, 
            email: data.data.email, 
            role: data.data.role,
            invitePending: false
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
                    const collection = client.db("graphite-docs-pro-accounts").collection("organizations");
                    // Perform actions on the collection object
                    collection.updateOne({"orgProfile.orgId": data.data.orgId, "orgProfile.teams.id": data.data.selectedTeam}, {$set: {"orgProfile.teams.users.$.username": data.data.username}}, function(err, res) {
                        if(err) {
                            success = {
                                success: false, 
                                message: "Error",
                                data: err
                            }
                            resolve(success);
                            client.close();
                        } else {
                            success = {
                                success: true, 
                                data: res
                            }
                            resolve(success);
                            client.close();
                            // const auditDetails = {
                            //     username: token.claim.username, 
                            //     date: new Date(), 
                            //     actions: "Added new team", 
                            //     data: data.team
                            // }
                            //audits.postAudit(auditDetails);
                        }
                    })
                }
             });
        });
        return mongoResponse.then((success) => {
            console.log(success);
            return success;
        })
    }
}