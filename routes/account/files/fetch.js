const mongoose = require('mongoose');
const fileModel = require('../../../models/fileModel');
require('dotenv').config()
const uri = process.env.MONGO_URI_PRO_ACCOUNTS_DEV;

module.exports = {
    fetchTeamFiles: function(orgId, teamId) {
        let success = {};
        const mongoResponse = new Promise((resolve, reject) => {
            fileModel.find({ orgId: orgId, teamId: teamId }, async function(err, files) {
                if(err) {
                    console.log(err);
                } else {
                    console.log(files);
                    if(files.length > 0) {
                      success = {
                          success: true, 
                          data: files
                      }
                      resolve(success);
                    } else {
                        success = {
                            success: false, 
                            message: "No files found"
                        }
                        resolve(success);
                    }
                }
            })
        });
        return mongoResponse.then((success) => {
            console.log(success);
            return success;
        });
    }
}