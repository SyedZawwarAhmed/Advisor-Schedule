import { findContactByEmail, getContactNotes } from './hubspot';
import { prisma } from '@/prisma';

// Get details of a contact in HubSpot
export const getContactDetails = async ({
  email,
}: {
  email: string;
}) => {
  try {
    // Find all users who have connected Hubspot
    const hubspotAccounts = await prisma.hubspotAccount.findMany();
    
    if (hubspotAccounts.length === 0) {
      console.log('No HubSpot accounts found');
      return null;
    }
    
    // Try to find contact in any connected HubSpot account
    let contact = null;
    let currentAccount = null;
    
    // Search for the contact in any account
    for (const account of hubspotAccounts) {
      try {
        const foundContact = await findContactByEmail(
          account.accessToken,
          account.refreshToken,
          account.userId,
          email
        );
        if (foundContact) {
          contact = foundContact;
          currentAccount = account;
          break;
        }
      } catch (error) {
        console.error('Error searching contact in account:', account.userId, error);
        continue;
      }
    }
    
    // If we found a contact, get their notes for context
    if (contact && currentAccount) {
      try {
        // Get the latest account info in case the token was refreshed
        const updatedAccount = await prisma.hubspotAccount.findUnique({
          where: { id: currentAccount.id },
        });

        if (!updatedAccount) {
          throw new Error('HubSpot account not found after contact search');
        }

        const notes = await getContactNotes(
          updatedAccount.accessToken,
          updatedAccount.refreshToken,
          updatedAccount.userId,
          contact.id
        );
        
        return {
          id: contact.id,
          properties: contact.properties,
          notes: notes.map((note: any) => note.properties.hs_note_body || ''),
        };
      } catch (error) {
        console.error('Error getting contact notes:', error);
        return {
          id: contact.id,
          properties: contact.properties,
          notes: [],
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error in HubSpot contact management:', error);
    return null;
  }
}; 