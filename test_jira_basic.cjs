const axios = require('axios');
async function test() {
    const clientId = process.env.JIRA_CLIENT_ID;
    const clientSecret = process.env.JIRA_SECRET;
    console.log("Client ID present:", !!clientId, clientId);
    
    if (!clientId || !clientSecret) return;
    
    // Just try hitting something public but authenticated with basic auth
    try {
        const domain = process.env.JIRA_DOMAIN || 'your-domain.atlassian.net';
        console.log("Using domain:", domain);
        const auth = Buffer.from(clientId + ":" + clientSecret).toString('base64');
        const res = await axios.get("https://" + domain + "/rest/api/3/myself", {
            headers: { Authorization: "Basic " + auth }
        });
        console.log("Success:", res.data.displayName);
    } catch (e) {
        console.error("Error Response:", e.response ? e.response.status + " " + JSON.stringify(e.response.data) : e.message);
    }
}
test();
