const mongoose = require('mongoose');
const docModel = require('../../../models/documentModel');
require('dotenv').config();

const uri = process.env.MONGO_URI_PRO_ACCOUNTS_DEV;
//mongoose.connect(uri, {useNewUrlParser: true});

module.exports = {
    postNewDoc: function(data) {
        //mongoose.connect(uri, {useNewUrlParser: true});
        let success = {};
        //mongoose.connect(uri, {useNewUrlParser: true});
        var db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', async function() {
            //First check if the doc exists
            const mongoResponse = new Promise((resolve, reject) => {
                docModel.find({ id: data.id, teamId: data.teamId }, async function(err, docs) {
                    if(err) {
                        console.log(err);
                    } else {
                        console.log(docs);
                        if(docs.length > 0) {
                            //Need to update doc
                            let thisDoc = docs[0];
                            thisDoc.title = data.title;
                            thisDoc.lastUpdated = data.lastUpdated;
                            thisDoc.timestamp = data.timestamp;
                            thisDoc.currentHostBucket = data.currentHostBucket;
                            thisDoc.save();
                            success = {
                                success: true,
                                message: "Document updated"
                            }
                            resolve(success);
                        } else {
                            let doc = new docModel({
                                id: data.id,
                                title: data.title, 
                                teamName: data.teamName,
                                orgId: data.orgId,
                                teamId: data.teamId,
                                lastUpdated: data.lastUpdated,
                                timestamp: data.timestamp, 
                                currentHostBucket: data.currentHostBucket
                            });
                            console.log(doc);
                            doc.save(function (err, doc) {
                                if (err) return console.error(err);
                                success = {
                                    success: true,
                                    data: doc
                                }
                                console.log(doc)
                                resolve(success);
                              });
                        }
                    }
                    })
                });
                return mongoResponse.then((success) => {
                    console.log(success);
                    //mongoose.disconnect();
                    return success;
                });
            });
    }
}