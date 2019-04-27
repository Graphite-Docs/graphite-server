const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()

const uri = process.env.MONGO_URI_PRO_ACCOUNTS_DEV;

module.exports = {
    fetchUser: function(username) {
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
                    //Find user
                    collection.find({'accountProfile.profile.username': username}).toArray(function(err, docs) {
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
                                let userDoc = docs[0]
                                success = {
                                    success: true, 
                                    data: userDoc
                                }
                                resolve(success);
                                client.close();
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
          console.log(success);
          return success;
        })
    }
}