const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()

const uri = process.env.MONGO_URI_PRO_ACCOUNTS_DEV;


module.exports = {
    postNewUser: function (payload) {
        console.log(payload.data.orgId);
        console.log("creating user...");
        const userObj = {
            id: payload.data.id,
            username: null,
            isAdmin: payload.data.role === "Admin" ? true : false,
            email: payload.data.email, 
            name: payload.data.name
        };
        let success = {};
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
                    collection.updateOne({"orgProfile.orgId": payload.data.orgId}, {$push: {"orgProfile.users": userObj}}, function(err, res) {
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
                                message: "User added"
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
    }, 
    postToTeam: function(payload) {
        console.log(payload.data.orgId);
        console.log("creating user...");
        const teamUserObj = {
            id: payload.data.id,
            username: null,
            role: payload.data.role,
            email: payload.data.email, 
            name: payload.data.name, 
            invitePending: true
        };
        let success = {};
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
                    collection.updateOne({"orgProfile.orgId": payload.data.orgId, "orgProfile.teams.id": payload.data.selectedTeam}, {$push: {"orgProfile.teams.$.users": teamUserObj}}, function(err, res) {
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
                                message: "User added"
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