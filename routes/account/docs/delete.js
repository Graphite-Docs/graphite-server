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
            // docModel.find({ orgId: data.orgId, teamId: data.teamId, id: data.docId }, async function(err, docs) {
            //     if(err) {
            //         console.log(err);
            //     } else {
            //         console.log(docs);
            //         if(docs.length > 0) {
            //           //Now we delete it
            //           //const thisDoc = docs[0];
            //           docModel.deleteOne({ orgId: data.orgId, teamId: data.teamId, docId: data.docId }, async function(err, res) {
            //             if(err) {
            //                 success = {
            //                     success: false,
            //                     message: err
            //                 }
            //                 resolve(success);
            //             } else {
                            
            //                 success = {
            //                     success: true,
            //                     message: "Document deleted"
            //                 }
            //                 resolve(success);
            //             }
            //           });
            //         } else {
            //             success = {
            //                 success: false, 
            //                 message: "No documents found"
            //             }
            //             resolve(success);
            //         }
            //     }
            // })
        });
        return mongoResponse.then((success) => {
            console.log(success);
            return success;
        });
    }
}