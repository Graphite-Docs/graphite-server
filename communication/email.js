const sgMail = require('@sendgrid/mail');
require('dotenv').config();
sgMail.setApiKey(process.env.SENDGRID_DEV_API_KEY);
let success;

module.exports = {
    sendInviteEmail: async function(payload) {
        const msg = {
            to: payload.userData.email,
            from: 'contact@graphitedocs.com',
            subject: 'Welcome to Graphite Pro',
            text: `You have been invited to join the ${payload.userData.orgName} team. Click the link below or paste it into your browser to get started.`,
            html: '<strong>You have been invited to join team. Click the link below or paste it into your browser to get started.</strong>',
            templateId: 'd-7cfe71e67aef473d8300d66558ffb25a',
            dynamic_template_data: {
                inviteUrl: payload.inviteUrl, 
                teamName: payload.userData.orgName, 
                name: payload.userData.name
            },
          };
        await sgMail.send(msg);
        success = {
            success: true, 
            message: "Invite email sent"
        }
        return success;


    },
    welcomeEmail: function(data) {
        console.log("This would fire a new trial account email:");
        console.log(data);
    }, 
    newUserEmail: function() {

    }, 
    trialAlmostOverEmail: function() {

    }, 
    trialOverEmail: function() {

    }, 
    accountUpgradedEmail: function() {

    }, 
    paymentReceivedEmail: function() {

    }
}