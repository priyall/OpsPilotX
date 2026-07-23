const axios = require('axios');
async function test() {
    const clientId = process.env.JIRA_CLIENT_ID;
    const clientSecret = process.env.JIRA_SECRET;
    console.log("Client ID present:", !!clientId);
    console.log("Client Secret present:", !!clientSecret);
    
    if (!clientId || !clientSecret) return;
    
    try {
        const tokenRes = await axios.post('https://api.atlassian.com/oauth/token', {
            audience: 'api.atlassian.com',
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret
        });
        console.log("Token acquired");
        const token = tokenRes.data.access_token;
        
        const resourceRes = await axios.get('https://api.atlassian.com/oauth/token/accessible-resources', {
            headers: { Authorization: "Bearer " + token }
        });
        console.log("Resources:", resourceRes.data);
    } catch (e) {
        console.error("Error Response:", e.response ? e.response.data : e.message);
    }
}
test();
