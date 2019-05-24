const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

const uri = process.env.MONGO_URI_PRO_ACCOUNTS_DEV;

module.exports = {
    fetchOrg: function(orgId) {
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
                    collection.find({'orgProfile.orgId': orgId}).toArray(function(err, docs) {
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
                                //If the user ID is found, we shoudn't add them
                                console.log("Found the following records");
                                let orgDoc = docs[0];
                                // if(orgDoc.orgProfile.trialAccount.onTrial) {
                                //     const currentDate = Date.now();
                                //     if(currentDate > orgDoc.orgProfile.trialAccount.trialEnd) {
                                //         orgDoc.orgProfile.trialAccount["expired"] = true;
                                //     } else {
                                //         orgDoc.orgProfile.trialAccount["expired"] = false;
                                //         orgDoc.orgProfile.trialAccount["timestamp"] = Date.now();
                                //     }
                                // }
                                console.log("Boomtown")
                                if(orgDoc.accountPlan.planType === "Trial") {
                                    console.log("heyo")
                                    const currentDate = Date.now();
                                    if(currentDate > orgDoc.accountPlan.trialEnd) {
                                        orgDoc.accountPlan.trialExpired["expired"] = true;
                                    } else {
                                        orgDoc.accountPlan.trialExpired = false;
                                        orgDoc.accountPlan["timestamp"] = Date.now();
                                    }
                                }
                                success = {
                                    success: true, 
                                    data: orgDoc
                                }
                                resolve(success);
                                client.close();
                            } else {
                                success = {
                                    success: false, 
                                    message: "No org found"
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