const mongoose = require('mongoose');
const formModel = require('../../../models/formModel');
const formResponseModel = require('../../../models/formResponseModel');
require('dotenv').config();

const uri = process.env.MONGO_URI_PRO_ACCOUNTS_DEV;
//mongoose.connect(uri, {useNewUrlParser: true});

module.exports = {
    postNewForm: function(data) {
        let success = {};
        //mongoose.connect(uri, {useNewUrlParser: true});
        var db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', async function() {
            //First check if the doc exists
            const mongoResponse = new Promise((resolve, reject) => {
                formModel.find({ id: data.id, teamId: data.teamId }, async function(err, forms) {
                    if(err) {
                        console.log(err);
                    } else {
                        console.log(forms);
                        if(forms.length > 0) {
                            //Need to update doc
                            let thisForm = forms[0];
                            thisForm.title = data.title;
                            thisForm.lastUpdated = data.lastUpdated;
                            thisForm.timestamp = data.timestamp;
                            thisForm.currentHostBucket = data.currentHostBucket;
                            thisForm.responses = data.responses || [];
                            thisForm.save();
                            success = {
                                success: true,
                                message: "Form updated"
                            }
                            resolve(success);
                        } else {
                            let form = new formModel({
                                id: data.id,
                                title: data.title, 
                                teamName: data.teamName,
                                orgId: data.orgId,
                                teamId: data.teamId,
                                lastUpdated: data.lastUpdated,
                                timestamp: data.timestamp, 
                                currentHostBucket: data.currentHostBucket, 
                                responses: []
                            });
                            console.log(form);
                            form.save(function (err, newForm) {
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
                                        data: newForm
                                    }
                                    resolve(success);
                                }
                              });
                        }
                    }
                    })
                });
                return mongoResponse.then((success) => {
                    //mongoose.disconnect();
                    console.log(success);
                    return success;
                });
            });
    }, 
    postNewResponse: function(data) {
        let success = {};
        //mongoose.connect(uri, {useNewUrlParser: true});
        var db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', async function() {
            //First check if the doc exists
            const mongoResponse = new Promise((resolve, reject) => {
                formModel.find({ id: data.formId, orgId: data.orgId }, async function(err, forms) {
                    if(err) {
                        console.log(err);
                    } else {
                        console.log(forms);
                        if(forms.length > 0) {
                            //Need to update doc
                            let thisForm = forms[0];
                            let responses = thisForm.responses;
                            responses.push(data.responses);
                            thisForm.responses = responses;
                            thisForm.save();
                            success = {
                                success: true,
                                message: "Response posted"
                            }
                            resolve(success);
                        } else {
                            console.log("Form not found");
                            success = {
                                success: false, 
                                message: "Form not found"
                            }
                            resolve(success);
                        }
                    }
                    })
                });
                return mongoResponse.then((success) => {
                    //mongoose.disconnect();
                    console.log(success);
                    return success;
                });
            });
    }, 
    postNewIndividualResponse: function(data) {
        let success = {};
        //mongoose.connect(uri, {useNewUrlParser: true});
        var db = mongoose.connection;
        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', async function() {
            //First check if the doc exists
            const mongoResponse = new Promise((resolve, reject) => {
                formResponseModel.find({ formId: data.formId }, async function(err, forms) {
                    if(err) {
                        console.log(err);
                    } else {
                        if(forms.length > 0) {
                            console.log("Found form, adding responses")
                            //Need to update doc
                            let thisForm = forms[0];
                            let responses = thisForm.responses;
                            responses.push(data);
                            thisForm.responses = responses;
                            thisForm.save();
                            success = {
                                success: true,
                                message: "Response posted"
                            }
                            resolve(success);
                        } else {
                            console.log("No form yet, creating and adding responses");
                            let form = new formResponseModel({
                                formId: data.formId,
                                formTitle: data.formTitle, 
                                responses: data,
                                orgId: data.orgId
                            });
                            console.log(form);
                            form.save(function (err, newResponse) {
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
                                        data: newResponse
                                    }
                                    resolve(success);
                                }
                              });
                        }
                    }
                    })
                });
                return mongoResponse.then((success) => {
                    //mongoose.disconnect();
                    console.log(success);
                    return success;
                });
            });
    }
}