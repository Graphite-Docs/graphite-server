const mongoose = require('mongoose');
const docModel = require('../../../models/documentModel');
require('dotenv').config()
const uri = process.env.MONGO_URI_PRO_ACCOUNTS_DEV;

module.exports = {
    fetchTeamDocs: function(orgId, teamId) {
        let success = {};
        const mongoResponse = new Promise((resolve, reject) => {
            docModel.find({ orgId: orgId, teamId: teamId }, async function(err, docs) {
                if(err) {
                    console.log(err);
                } else {
                    console.log(docs);
                    if(docs.length > 0) {
                      success = {
                          success: true, 
                          data: docs
                      }
                      resolve(success);
                    } else {
                        success = {
                            success: false, 
                            message: "No documents found"
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
    }
}