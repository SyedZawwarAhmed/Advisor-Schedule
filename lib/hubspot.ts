import { Client } from '@hubspot/api-client';
import { prisma } from '@/prisma';

// Create HubSpot client with the given credentials
export const getHubspotClient = (accessToken: string) => {
  const hubspotClient = new Client({ accessToken });
  return hubspotClient;
};

// Find contact by email in HubSpot
export const findContactByEmail = async (accessToken: string, email: string) => {
  const hubspotClient = getHubspotClient(accessToken);
  
  try {
    // Search for contact with the specific email
    const searchResponse = await hubspotClient.crm.contacts.searchApi.doSearch({
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'email',
              operator: 'EQ',
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

// Get contact notes and associated data from HubSpot
export const getContactNotes = async (accessToken: string, contactId: string) => {
  const hubspotClient = getHubspotClient(accessToken);
  
  try {
    // Get notes associated with the contact
    const notesResponse = await hubspotClient.crm.contacts.associationsApi.getAll(
      contactId,
      'notes'
    );
    
    const noteIds = notesResponse.results.map(result => result.id);
    
    if (noteIds.length === 0) {
      return [];
    }
    
    // Batch get all notes content
    const batchResponse = await hubspotClient.crm.notes.batchApi.read({
      inputs: noteIds.map(id => ({ id })),
      properties: ['hs_note_body', 'hs_createdate'],
    });
    
    return batchResponse.results || [];
  } catch (error) {
    console.error('Error getting HubSpot contact notes:', error);
    return [];
  }
};

// Create a new contact in HubSpot
export const createContact = async (
  accessToken: string,
  contactData: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }
) => {
  const hubspotClient = getHubspotClient(accessToken);
  
  try {
    const response = await hubspotClient.crm.contacts.basicApi.create({
      properties: {
        email: contactData.email,
        firstname: contactData.firstName || '',
        lastname: contactData.lastName || '',
        phone: contactData.phone || '',
      },
    });
    
    return response;
  } catch (error) {
    console.error('Error creating HubSpot contact:', error);
    throw error;
  }
};

// Add a note to a contact in HubSpot
export const addContactNote = async (
  accessToken: string,
  contactId: string,
  noteBody: string
) => {
  const hubspotClient = getHubspotClient(accessToken);
  
  try {
    // Create note
    const noteResponse = await hubspotClient.crm.notes.basicApi.create({
      properties: {
        hs_note_body: noteBody,
      },
    });
    
    // Associate note with contact
    if (noteResponse.id) {
      await hubspotClient.crm.notes.associationsApi.create(
        noteResponse.id,
        'contact',
        contactId
      );
    }
    
    return noteResponse;
  } catch (error) {
    console.error('Error adding note to HubSpot contact:', error);
    throw error;
  }
};

// Get the HubSpot account for a user
export const getUserHubspotAccount = async (userId: string) => {
  const hubspotAccount = await prisma.hubspotAccount.findUnique({
    where: { userId },
  });
  
  return hubspotAccount;
}; 