const mongoose = require('mongoose');
const docModel = require('../../../models/documentModel');
require('dotenv').config();

const uri = process.env.MONGO_URI_PRO_ACCOUNTS_DEV;

module.exports = {
    postNewDoc: function(data) {
        let success = {};
        mongoose.connect(uri, {useNewUrlParser: true});
            var db = mongoose.connection;
            db.on('error', console.error.bind(console, 'connection error:'));
            db.once('open', async function() {
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
                  });
            });
    }
}