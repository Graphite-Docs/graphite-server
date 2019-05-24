const MongoClient = require('mongodb').MongoClient;
const mongoose = require('mongoose');
const orgModel = require('../../../models/orgModel');
const clientModel = require('../../../models/orgClientModel');
require('dotenv').config()

const uri = process.env.MONGO_URI_PRO_ACCOUNTS_DEV;
mongoose.connect(uri, {useNewUrlParser: true});

module.exports = {
    fetchUser: function(data) {
        let success = {};
        const mongoResponse = new Promise((resolve, reject) => {
            orgModel.find({ orgId: data.orgId }, async function(err, docs) {
                if(err) {
                    console.log(err);
                } else {
                    if(docs.length > 0) {
                        if(data.username) {

                            const modelToReturn = await clientModel.fetchModel(docs[0], data);
                            console.log("model");
                            console.log(modelToReturn);
                            success = {
                                success: true, 
                                data: modelToReturn
                            }
                            resolve(success);
                        } else {
                            success = {
                                success: false, 
                                message: "No username set yet"
                            }
                        }
                    } else {
                        success = {
                            success: false, 
                            message: "User not found"
                        }
                        resolve(success);
                    }
                }
            })
        });
        return mongoResponse.then((success) => {
            mongoose.disconnect();
            console.log(success);
            return success;
        });

        // const mongoResponse = new Promise((resolve, reject) => {
        //     MongoClient.connect(uri, {useNewUrlParser: true}, function(err, client) {
        //         if(err) {
        //             success = {
        //                 success: false, 
        //                 message: "Error occurred while connecting to MongoDB Atlas...\n"
        //             };
        //             resolve(success);
        //             console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
        //         } else {
        //             console.log('Connected...');
        //             const collection = client.db("graphite-docs-pro-accounts").collection("organizations");
        //             // Perform actions on the collection object
        //             //Find user
        //             collection.find({'orgProfile.users.username': data.username}).toArray(function(err, docs) {
        //                 if(err) {
        //                     console.log(err)
        //                     success = {
        //                         success: false, 
        //                         message: err
        //                     };
        //                     resolve(success);
        //                     client.close();
        //                 } else {
        //                     if(docs.length > 0) {
        //                         if(docs.length > 1) {
        //                             //User is member of more than one org and we should provide an org switcher
        //                             console.log(`user is a member of ${docs.length} orgs`);
        //                         } else {
        //                             //If the user ID is found, we shoudn't add them
        //                             console.log("Found the following records");
        //                             let userDoc = docs[0];
        //                             if(userDoc.orgProfile.accountPlan.planType === "Trial") {
        //                                 const currentDate = Date.now();
        //                                 if(currentDate > userDoc.orgProfile.accountPlan.trialEnd) {
        //                                     userDoc.orgProfile.accountPlan["trialExpired"] = true;
        //                                 } else {
        //                                     userDoc.orgProfile.accountPlan["trialExpired"] = false;
        //                                     userDoc.orgProfile.accountPlan["timestamp"] = Date.now();
        //                                 }
        //                             }
        //                             success = {
        //                                 success: true, 
        //                                 data: userDoc, 
        //                                 message: "User found"
        //                             }
        //                             resolve(success);
        //                             client.close();
        //                         }
        //                     } else {
        //                         success = {
        //                             success: false, 
        //                             message: "No user found"
        //                         }
        //                         resolve(success);
        //                         client.close();
        //                     }
        //                 }
        //               });
        //         }
        //      });
        // })

    }, 
    fetchUserById: function(data) {
        let success = {};
        const mongoResponse = new Promise((resolve, reject) => {
            MongoClient.connect(uri, {useNewUrlParser: true}, function(err, client) {
                if(err) {
                    success = {
                        success: false, 
                        message: "Error occurred while connecting to MongoDB Atlas...\n"
                    };
                    resolve(success);
                    console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
                } else {
                    console.log('Connected...');
                    const collection = client.db("graphite-docs-pro-accounts").collection("organizations");
                    // Perform actions on the collection object
                    //Find user
                    collection.find({'orgProfile.users.id': data.id}).toArray(function(err, docs) {
                        if(err) {
                            console.log(err)
                            success = {
                                success: false, 
                                message: err
                            };
                            resolve(success);
                            client.close();
                        } else {
                            if(docs.length > 0) {
                                if(docs.length > 1) {
                                    //User is member of more than one org and we should provide an org switcher
                                    console.log(`user is a member of ${docs.length} orgs`);
                                } else {
                                    //If the user ID is found, we shoudn't add them
                                    console.log("Found the following records");
                                    let userDoc = docs[0];
                                    if(userDoc.orgProfile.accountPlan.planType === "Trial") {
                                        const currentDate = Date.now();
                                        if(currentDate > userDoc.orgProfile.accountPlan.trialEnd) {
                                            userDoc.orgProfile.accountPlan["trialExpired"] = true;
                                        } else {
                                            userDoc.orgProfile.accountPlan["trialExpired"] = false;
                                            userDoc.orgProfile.accountPlan["timestamp"] = Date.now();
                                        }
                                    }
                                    success = {
                                        success: true, 
                                        message: "User found",
                                        data: userDoc
                                    }
                                    resolve(success);
                                    client.close();
                                }
                            } else {
                                success = {
                                    success: false, 
                                    message: "No user found"
                                }
                                resolve(success);
                                client.close();
                            }
                        }
                      });
                }
             });
        })
        return mongoResponse.then((success) => {
          mongoose.disconnect();
          console.log(success);
          return success;
        })
    }
}