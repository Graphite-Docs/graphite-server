module.exports = {
    fetchModel: function(dbData, userData) {
        const thisUser = dbData.users.filter(user => user.username === userData.username)[0];
        const currentDate = Date.now();
        if(thisUser) {
            if(thisUser.isAdmin) {
                return {
                    accountPlan: {
                        planType: dbData.accountPlan.planType,
                        signUpDate: dbData.accountPlan.signUpDate,
                        trialEnd: dbData.accountPlan.trialEnd,
                        trialExpired: currentDate > dbData.accountPlan.trialEnd ? true : false,
                        suspended: dbData.accountPlan.suspended,
                        overdue: dbData.accountPlan.overdue,
                        timestamp: Date.now(), 
                        paymentHistory: dbData.accountPlan.paymentHistory,
                        suspended: dbData.accountPlan.suspended,
                        amountDue: dbData.accountPlan.amountDue,
                        nextPayment: dbData.accountPlan.nextPayment
                    },
                    teams: dbData.teams,
                    users: thisUser.isAdmin ? dbData.users : [],
                    name: dbData.name,
                    orgId: dbData.orgId
                };
            } else {
                let teams = dbData.teams;
                let updatedTeams = [];
                teams.map(team => {
                    if(team.users.some(user => user.username === userData.username)) {
                        updatedTeams.push(team);
                    }
                });
                return {
                    accountPlan: {
                        planType: dbData.accountPlan.planType,
                        signUpDate: dbData.accountPlan.signUpDate,
                        trialEnd: dbData.accountPlan.trialEnd,
                        trialExpired: currentDate > dbData.accountPlan.trialEnd ? true : false,
                        suspended: dbData.accountPlan.suspended,
                        overdue: dbData.accountPlan.overdue,
                        timestamp: Date.now()
                    },
                    teams: updatedTeams,
                    users: thisUser.isAdmin ? dbData.users : [],
                    name: dbData.name,
                    orgId: dbData.orgId
                };
            }
        } else {
            return {};
        }
        
    }
}