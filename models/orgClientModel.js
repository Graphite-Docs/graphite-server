module.exports = {
    fetchModel: function(dbData, userData) {
        const thisUser = dbData.users.filter(user => user.username === userData.username)[0];
        if(thisUser) {
            if(thisUser.isAdmin) {
                return dbData;
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
                        trialExpired: dbData.accountPlan.trialExpired,
                        suspended: dbData.accountPlan.suspended,
                        overdue: dbData.accountPlan.overdue,
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