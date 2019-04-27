const MongoClient = require('mongodb').MongoClient;
const date = require('../../getMonthDayYear');
require('dotenv').config()

const uri = process.env.MONGO_URI_PRO_ACCOUNTS_DEV;


module.exports = {
    postSignUp: function (signUpData, token, teamId) {
        console.log("creating user...")
        //Construct the account profile
        const accountProfile = {
            orgInfo: {
                name: signUpData.organization,
                creator: signUpData.blockstackId
            },
            profile: {
                username: token.claim.username,
                email: signUpData.email
            },
            membershipTeams: [
                {
                    teamId, 
                    name: signUpData.teamName ? signUpData.teamName : "Admins"
                }
            ]
        }
        //Need to post this data to Mongo
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
                    const collection = client.db("graphite-docs-pro-accounts").collection("users");
                    // Perform actions on the collection object
                    //One: Check to see if the user is in the db
                    collection.find({'accountProfile.signUpData.blockstackId': signUpData.blockstackId}).toArray(function(err, docs) {
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
                                //If the user ID is found, we shoudn't add them
                                console.log("Found the following records");
                                console.log(docs);
                                success = {
                                    success: false, 
                                    message: "User already exists"
                                }
                                resolve(success);
                                client.close();
                            } else {
                                //No user yet, add them to the collection
                                collection.insertOne({ 
                                    accountProfile
                                }, (err, result) => {
                                    if(err) {
                                        console.log(err);
                                    } else {
                                        console.log(result);
                                    }
                                })
                                success = {
                                    success: true, 
                                    message: "Account created"
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
          console.log(success);
          return success;
      })
    }
}