const MongoClient = require('mongodb').MongoClient;
const mongoose = require('mongoose');
const newUser = require('../user/new');
const date = require('../../getMonthDayYear');
const uuid = require('uuidv4');
const orgModel = require('../../../models/orgModel');
const userModel = require('../../../models/userModel');
require('dotenv').config()

const uri = process.env.MONGO_URI_PRO_ACCOUNTS_DEV;


module.exports = {
    postSignUp: function (orgData, token) {
        //mongoose.connect(uri, {useNewUrlParser: true});
        const teamId = uuid();
        //Need to post this data to Mongo or Gaia
        let success = {};
        //mongoose.connect(uri, {useNewUrlParser: true});
        var db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', function() {
            var user = new userModel({
                name: orgData.name, 
                id: orgData.userId, 
                email: orgData.email, 
                username: orgData.blockstackId,
                role: "Admin",
                invitePending: false, 
                teamId: teamId
            })
            var org = new orgModel({ 
                name: orgData.organization, 
                orgId: orgData.orgId, 
                creator: orgData.blockstackId, 
                creatorEmail: orgData.email,
                accountPlan: {
                    planType: "Trial",
                    signUpDate: date.getMonthDayYear(),
                    trialEnd: new Date().setDate(new Date().getDate() + 30),
                    trialExpired: false,
                    overdue: false, 
                    suspended: false,
                    amountDue: 0.00,
                    nextPayment: null,
                    paymentHistory: []
                }, 
                teams: [
                    {
                        name: "Admins",
                        id: teamId,
                        pubKey: orgData.teamPubKey, 
                        users: [
                            user
                        ]
                    }
                ], 
                users: [
                    {
                        id: orgData.userId,
                        username: token.claim.username,
                        isAdmin: true,
                        email: orgData.email,
                        name: orgData.name
                    }
                ]
            });
        org.save(function (err, org) {
            if (err) return console.error(err);
            //mongoose.disconnect();
            console.log(org)
          });
        });
        // const mongoResponse = new Promise((resolve, reject) => {
            // MongoClient.connect(uri, {useNewUrlParser: true}, function(err, client) {
            //     if(err) {
            //         success = {
            //             success: false, 
            //             message: "Error occurred while connecting to MongoDB Atlas...\n"
            //         };
            //         resolve(success);
            //         console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
            //     } else {
            //         console.log('Connected...');
            //         const collection = client.db("graphite-docs-pro-accounts").collection("organizations");
            //         // Perform actions on the collection object
            //         collection.find({'orgProfile.orgName': orgData.organization}).toArray(function(err, docs) {
            //             if(err) {
            //                 console.log(err)
            //                 success = {
            //                     success: false, 
            //                     err: err
            //                 }
            //                 resolve(success);
            //                 client.close();
            //             } else {
            //                 if(docs.length > 0) {
            //                     //If the org is found, we shoudn't add them
            //                     console.log("Found the following records");
            //                     console.log(docs);
            //                     success = {
            //                         success: false, 
            //                         message: "Organization already exists"
            //                     }
            //                     resolve(success);
            //                     client.close();
            //                 } else {
            //                     //No user yet, add them to the collection
            //                     collection.insertOne({ 
            //                         orgProfile
            //                     }, (err, result) => {
            //                         if(err) {
            //                             console.log(err);
            //                         } else {
            //                             console.log(result);
            //                         }
            //                     })
            //                     success = {
            //                         success: true, 
            //                         message: "Organization created"
            //                     }
            //                     resolve(success);
            //                     client.close();
            //                     //newUser.postSignUp(orgData, token, teamId)
            //                 }
            //             }
            //           });
            //     }
            //  });
        // })
    //   return mongoResponse.then((success) => {
    //       console.log(success);
    //       return success;
    //   })
    }
}