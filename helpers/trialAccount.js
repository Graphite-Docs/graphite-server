const MongoClient = require('mongodb').MongoClient;
const date = require('./getMonthDayYear');
require('dotenv').config()

// replace the uri string with your connection string.
const uri = process.env.MONGO_URI_PRO_ACCOUNTS_DEV;


module.exports = {
    postSignUp: function (signUpData, token) {
        //Construct the account profile
        delete signUpData.jwt;
        const accountProfile = {
            signUpData, 
            trialAccount: {
                onTrial: true,
                signUpDate: date.getMonthDayYear()
            },
            profile: {
                username: token.username, 
                profileUrl: token.profile_url
            }
        }
        console.log(accountProfile);
        //Need to post this data to Mongo or Gaia
        let success = {};
        const mongoResponse = new Promise((resolve, reject) => {
            MongoClient.connect(uri, {useNewUrlParser: true}, function(err, client) {
                if(err) {
                    success = {
                        success: false
                    };
                    resolve(success);
                    console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
                } else {
                    console.log('Connected...');
                    const collection = client.db("graphite-docs-pro-accounts").collection("accounts");
                    // perform actions on the collection object
                    success = {
                        success: true,
                        collection: true
                    };
                    client.close();
                    resolve(success);
                }
             });
        })
      return mongoResponse.then((success) => {
          console.log(success);
          return success;
      })
    }
}