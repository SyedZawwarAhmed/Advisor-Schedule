import { Client } from '@hubspot/api-client';
import { prisma } from '@/prisma';
import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/companies';

// Refresh HubSpot access token
export const refreshHubspotToken = async (refreshToken: string) => {
  try {
    const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.HUBSPOT_CLIENT_ID || '',
        client_secret: process.env.HUBSPOT_CLIENT_SECRET || '',
        refresh_token: refreshToken,
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    const tokens = await response.json();
    return tokens;
  } catch (error) {
    console.error('Error refreshing HubSpot token:', error);
    throw error;
  }
};

// Create HubSpot client with the given credentials and handle token refresh
export const getHubspotClient = async (accessToken: string, refreshToken: string, userId: string) => {
  try {
    // Get the current HubSpot account to check expiration
    const account = await prisma.hubspotAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      throw new Error('HubSpot account not found');
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const isExpired = account.expiresAt.getTime() - Date.now() < 5 * 60 * 1000;

    if (isExpired) {
      // Token expired or about to expire, refresh it
      const tokens = await refreshHubspotToken(refreshToken);
      
      // Update the tokens in the database
      await prisma.hubspotAccount.update({
        where: { userId },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        },
      });
      
      // Create new client with refreshed token
      return new Client({ accessToken: tokens.access_token });
    }

    // Token is still valid, create client with current token
    return new Client({ accessToken });
  } catch (error: any) {
    console.error('Error in getHubspotClient:', error);
    throw error;
  }
};

// Find contact by email in HubSpot
export const findContactByEmail = async (accessToken: string, refreshToken: string, userId: string, email: string) => {
  const hubspotClient = await getHubspotClient(accessToken, refreshToken, userId);
  
  try {
    const searchResponse = await hubspotClient.crm.contacts.searchApi.doSearch({
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'email',
              operator: FilterOperatorEnum.Eq,
              value: email,
            },
          ],
        },
      ],
      properties: ['email', 'firstname', 'lastname', 'phone', 'notes', 'hs_lead_status'],
      limit: 1,
    });

    if (searchResponse.results && searchResponse.results.length > 0) {
      return searchResponse.results[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error searching for HubSpot contact:', error);
    return null;
  }
};

// Get contact notes from HubSpot using associations API
export const getContactNotes = async (accessToken: string, refreshToken: string, userId: string, contactId: string) => {
  const hubspotClient = await getHubspotClient(accessToken, refreshToken, userId);
  try {
    // Step 1: Get associated note IDs using the batch associations API (Option 1 from HubSpot community)
    const assocBatchResponse = await hubspotClient.apiRequest({
      method: 'POST',
      path: '/crm/v3/associations/contact/note/batch/read',
      body: JSON.stringify({
        inputs: [{ id: contactId }]
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const assocBatchJson = await assocBatchResponse.json();
    const noteIds = (assocBatchJson.results?.[0]?.to || []).map((n: any) => n.id);
    if (!noteIds.length) return [];

    // Step 2: Batch get note details
    const notesBatchResponse = await hubspotClient.apiRequest({
      method: 'POST',
      path: '/crm/v3/objects/notes/batch/read',
      body: JSON.stringify({
        inputs: noteIds.map((id: string) => ({ id })),
        properties: ['hs_note_body', 'hs_createdate']
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const notesBatchJson = await notesBatchResponse.json();
    return notesBatchJson.results || [];
  } catch (error) {
    console.error('Error getting HubSpot contact notes:', error);
    return [];
  }
};

// Get the HubSpot account for a user
export const getUserHubspotAccount = async (userId: string) => {
  const hubspotAccount = await prisma.hubspotAccount.findUnique({
    where: { userId },
  });
  
  return hubspotAccount;
}; 