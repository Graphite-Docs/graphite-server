const mongoose = require('mongoose');
const fileModel = require('../../../models/fileModel');
require('dotenv').config();

const uri = process.env.MONGO_URI_PRO_ACCOUNTS_DEV;
//mongoose.connect(uri, {useNewUrlParser: true});

module.exports = {
    postNewFile: function(data) {
        let success = {};
        //mongoose.connect(uri, {useNewUrlParser: true});
            //First check if the doc exists
            const mongoResponse = new Promise((resolve, reject) => {
                fileModel.find({ id: data.id, teamId: data.teamId }, async function(err, files) {
                    if(err) {
                        console.log(err);
                    } else {
                        console.log(files);
                        if(files.length > 0) {
                            //Need to update doc
                            let thisFile = files[0];
                            thisFile.name = data.name;
                            thisFile.lastUpdated = data.lastUpdated;
                            thisFile.timestamp = data.timestamp;
                            thisFile.currentHostBucket = data.currentHostBucket;
                            thisFile.comments = data.comments || [];
                            thisFile.save();
                            success = {
                                success: true,
                                message: "File updated"
                            }
                            resolve(success);
                        } else {
                            let file = new fileModel({
                                id: data.id,
                                name: data.name, 
                                teamName: data.teamName,
                                orgId: data.orgId,
                                teamId: data.teamId,
                                lastUpdated: data.lastUpdated,
                                timestamp: data.timestamp, 
                                currentHostBucket: data.currentHostBucket,
                                comments: data.comments || []
                            });
                            console.log(file);
                            file.save(function (err, file) {
                                if(err) {
                                    console.log(err);
                                    success = {
                                        success: false, 
                                        message: err
                                    }
                                    resolve(success);
                                } else {
                                    success = {
                                        success: true,
                                        data: file
                                    }
                                    resolve(success);
                                }
                              });
                        }
                    }
                    })
                });
                return mongoResponse.then((success) => {
                   // mongoose.disconnect();
                    console.log(success);
                    return success;
                });
    }
}