const mongoose = require('mongoose');
const formModel = require('../../../models/formModel');
const formResponseModel = require('../../../models/formResponseModel');
require('dotenv').config()
const uri = process.env.MONGO_URI_PRO_ACCOUNTS_DEV;

module.exports = {
    fetchTeamForms: function(orgId, teamId) {
        let success = {};
        const mongoResponse = new Promise((resolve, reject) => {
            formModel.find({ orgId: orgId, teamId: teamId }, async function(err, forms) {
                if(err) {
                    console.log(err);
                } else {
                    console.log(forms);
                    if(forms.length > 0) {
                      success = {
                          success: true, 
                          data: forms
                      }
                      resolve(success);
                    } else {
                        success = {
                            success: false, 
                            message: "No forms found"
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
    }, 
    fetchIndividualForm: function(orgId, formId) {
        console.log("form id");
        console.log(formId);
        let success = {};
        const mongoResponse = new Promise((resolve, reject) => {
            formModel.find({ id: formId }, async function(err, forms) {
                if(err) {
                    console.log(err);
                } else {
                    if(forms.length > 0) {
                        const index = await forms.map((x) => {return x.id }).indexOf(formId);
                        const thisForm = forms[index];
                        if(thisForm) {
                            success = {
                                succes: true,
                                data: thisForm
                            }
                        } else {
                            success = {
                                success: false, 
                                message: "Form not found"
                            }
                        }
                      resolve(success);
                    } else {
                        success = {
                            success: false, 
                            message: "No forms found"
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
    }, 
    fetchResponses: function(orgId, formId) {
        let success = {};
        const mongoResponse = new Promise((resolve, reject) => {
            formModel.find({ id: formId }, async function(err, forms) {
                if(err) {
                    console.log(err);
                } else {
                    console.log("found em ");
                    console.log(forms);
                    if(forms.length > 0) {
                        const index = await forms.map((x) => {return x.id }).indexOf(formId);
                        const thisForm = forms[index];
                        const responses = thisForm.responses;
                        if(responses) {
                            success = {
                                succes: true,
                                data: responses
                            }
                        } else {
                            success = {
                                success: false, 
                                message: "Responses not found for this form"
                            }
                        }
                      resolve(success);
                    } else {
                        success = {
                            success: false, 
                            message: "No forms found"
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
    }, 
    fetchIndividualResponses: function(orgId, formId, userId) {
        let success = {};
        const mongoResponse = new Promise((resolve, reject) => {
            formResponseModel.find({ formId: formId }, async function(err, forms) {
                if(err) {
                    console.log(err);
                } else {
                    if(forms.length > 0) {
                        const index = await forms.map((x) => {return x.formId }).indexOf(formId);
                        const thisForm = forms[index];
                        console.log(thisForm);
                        const responses = thisForm.responses;
                        if(responses) {
                            success = {
                                succes: true,
                                data: responses
                            }
                        } else {
                            success = {
                                success: false, 
                                message: "Responses not found for this form"
                            }
                        }
                      resolve(success);
                    } else {
                        success = {
                            success: false, 
                            message: "No forms found"
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