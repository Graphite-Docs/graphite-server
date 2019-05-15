const mongoose = require('mongoose');
const fileModel = require('../../../models/fileModel');
require('dotenv').config()
const uri = process.env.MONGO_URI_PRO_ACCOUNTS_DEV;

module.exports = {
    delete: function(data) {
        console.log(data);
        let success = {};
        const mongoResponse = new Promise((resolve, reject) => {
            fileModel.deleteOne({ orgId: data.orgId, teamId: data.teamId, id: data.fileId }, async function(err, res) {
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
                        message: "File deleted"
                    }
                    resolve(success);
                }
              });
        });
        return mongoResponse.then((success) => {
            console.log(success);
            return success;
        });
    }
}