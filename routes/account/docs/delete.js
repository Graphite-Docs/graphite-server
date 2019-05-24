const mongoose = require('mongoose');
const docModel = require('../../../models/documentModel');
require('dotenv').config()
const uri = process.env.MONGO_URI_PRO_ACCOUNTS_DEV;

module.exports = {
    delete: function(data) {
        console.log(data);
        let success = {};
        const mongoResponse = new Promise((resolve, reject) => {
            docModel.deleteOne({ orgId: data.orgId, teamId: data.teamId, id: data.docId }, async function(err, res) {
                if(err) {
                    console.log(err);
                    success = {
                        success: false,
                        message: err
                    }
                    resolve(success);
                } else {
                    console.log(res);
                    success = {
                        success: true,
                        message: "Document deleted"
                    }
                    resolve(success);
                }
              });
        });
        return mongoResponse.then((success) => {
            console.log(success);
            mongoose.disconnect();
            return success;
        });
    }
}