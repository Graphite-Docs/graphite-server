const MongoClient = require('mongodb').MongoClient;
const newUser = require('../user/new');
const date = require('../../getMonthDayYear');
const uuid = require('uuidv4');
require('dotenv').config()

const uri = process.env.MONGO_URI_PRO_ACCOUNTS_DEV;


module.exports = {
    postSignUp: function (orgData, token) {
        const teamId = uuid();
        //Construct the account profile
        const orgProfile = {
            orgName: orgData.organization, 
            orgCreator: orgData.blockstackId, 
            orgCreatorEmail: orgData.email,
            trialAccount: {
                onTrial: true,
                signUpDate: date.getMonthDayYear()
            },
            paymentInfo: {
                lastPaidDate: "", 
                paymentHistory: []
            },
            teams: [
                {
                    name: "Admins",
                    id: teamId, 
                    users: [
                        {
                            username: token.claim.username
                        }
                    ],
                    pubKey: orgData.teamPubKey
                }
            ]
        }
        //Need to post this data to Mongo or Gaia
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
                    collection.find({'orgProfile.orgName': orgData.organization}).toArray(function(err, docs) {
                        if(err) {
                            console.log(err)
                            success = {
                                success: false, 
                                err: err
                            }
                            resolve(success);
                            client.close();
                        } else {
                            if(docs.length > 0) {
                                //If the org is found, we shoudn't add them
                                console.log("Found the following records");
                                console.log(docs);
                                success = {
                                    success: false, 
                                    message: "Organization already exists"
                                }
                                resolve(success);
                                client.close();
                            } else {
                                //No user yet, add them to the collection
                                collection.insertOne({ 
                                    orgProfile
                                }, (err, result) => {
                                    if(err) {
                                        console.log(err);
                                    } else {
                                        console.log(result);
                                    }
                                })
                                success = {
                                    success: true, 
                                    message: "Organization created"
                                }
                                resolve(success);
                                client.close();
                                newUser.postSignUp(orgData, token, teamId)
                            }
                        }
                      });
                }
             });
        })
      return mongoResponse.then((success) => {
          console.log(success);
          return success;
      })
    }
}