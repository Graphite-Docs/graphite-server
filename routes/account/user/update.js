const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()
const uri = process.env.MONGO_URI_PRO_ACCOUNTS_DEV;
const audits = require('../audit/new');

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
                            const auditDetails = {
                                username: token.claim.username, 
                                date: new Date(), 
                                actions: "Updated org name", 
                                data: data.orgName
                            }
                            audits.postAudit(auditDetails);
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
    }
}