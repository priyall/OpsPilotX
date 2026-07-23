import requests
import argparse
import sys
import json

# ServiceNow Configuration
INSTANCE_URL = "https://dev214684.service-now.com"
CLIENT_ID = "755f8d3137ac456ca10b8f90ac96ed98"

# You should ideally pass these securely via environment variables
ACCESS_TOKEN = "<PASTE_YOUR_ACCESS_TOKEN_HERE>"
REFRESH_TOKEN = "<PASTE_YOUR_REFRESH_TOKEN_HERE>"

def refresh_access_token():
    """
    Refreshes the ServiceNow OAuth Access Token using the refresh token.
    """
    print("Refreshing access token...")
    token_url = f"{INSTANCE_URL}/oauth_token.do"
    
    payload = {
        "grant_type": "refresh_token",
        "client_id": CLIENT_ID,
        "refresh_token": REFRESH_TOKEN
    }
    
    try:
        response = requests.post(token_url, data=payload)
        response.raise_for_status()
        tokens = response.json()
        new_access_token = tokens.get("access_token")
        if new_access_token:
            print("Successfully refreshed access token.")
            return new_access_token
        else:
            print("Failed to parse access token from response.")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Error refreshing token: {e}")
        return None

def fetch_closed_incidents(topic, access_token, limit=100, offset=0):
    """
    Fetches closed incidents matching a specific topic.
    """
    endpoint = f"{INSTANCE_URL}/api/now/table/incident"
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    # Query: state=7 (Closed) AND (short_description LIKE topic OR description LIKE topic)
    query = f"state=7^short_descriptionLIKE{topic}^ORdescriptionLIKE{topic}"
    fields = "number,short_description,description,state,priority,assigned_to,resolved_at,close_code,close_notes,category,subcategory"
    
    params = {
        "sysparm_query": query,
        "sysparm_fields": fields,
        "sysparm_display_value": "true",
        "sysparm_limit": limit,
        "sysparm_offset": offset
    }
    
    try:
        response = requests.get(endpoint, headers=headers, params=params)
        
        if response.status_code == 401:
            print("Access token expired or invalid (401 Unauthorized).")
            # Attempt to refresh token
            new_token = refresh_access_token()
            if new_token:
                # Retry fetch with new token
                return fetch_closed_incidents(topic, new_token, limit, offset)
            else:
                return None
                
        elif response.status_code == 403:
            print("Forbidden (403): You don't have permission to access these records.")
            return None
            
        elif response.status_code == 404:
            print("Not Found (404): The requested ServiceNow API endpoint was not found.")
            return None
            
        response.raise_for_status()
        return response.json().get("result", [])
        
    except requests.exceptions.RequestException as e:
        print(f"API Request Failed: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(description="Fetch closed ServiceNow incidents for RAG training.")
    parser.add_argument("topic", help="The topic or keyword to search for in incidents (e.g., 'network', 'email').")
    parser.add_argument("--limit", type=int, default=100, help="Maximum number of records to fetch.")
    
    args = parser.parse_args()
    
    print(f"Searching for closed incidents related to: '{args.topic}'...")
    
    results = fetch_closed_incidents(args.topic, ACCESS_TOKEN, limit=args.limit)
    
    if results is not None:
        print(f"\nFound {len(results)} incidents matching '{args.topic}':\n")
        
        # Display as a readable JSON
        print(json.dumps(results, indent=2))
        
        # Optionally, you could save this to a file for your RAG system
        filename = f"servicenow_closed_incidents_{args.topic.replace(' ', '_')}.json"
        with open(filename, "w") as f:
            json.dump(results, f, indent=2)
        print(f"\nResults saved to {filename}")

if __name__ == "__main__":
    main()
