import { getUserHubspotAccount, findContactByEmail, createContact, addContactNote, getContactNotes } from './hubspot';
import { prisma } from '@/prisma';

// Add or get details of a contact in HubSpot
export const addContactOrGetDetails = async ({
  email,
  linkedInProfile,
  linkedInInfo
}: {
  email: string;
  linkedInProfile?: string | null;
  linkedInInfo?: any;
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
    let accessToken = '';
    
    // First try to find the contact in any account
    for (const account of hubspotAccounts) {
      const foundContact = await findContactByEmail(account.accessToken, email);
      if (foundContact) {
        contact = foundContact;
        accessToken = account.accessToken;
        break;
      }
    }
    
    // If contact not found, create it in the first available account
    if (!contact && hubspotAccounts.length > 0) {
      accessToken = hubspotAccounts[0].accessToken;
      
      // Extract name from LinkedIn info if available
      let firstName = '';
      let lastName = '';
      
      if (linkedInInfo && linkedInInfo.name) {
        const nameParts = linkedInInfo.name.split(' ');
        if (nameParts.length > 0) {
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(' ');
        }
      }
      
      // Create new contact
      contact = await createContact(accessToken, {
        email,
        firstName,
        lastName,
      });
      
      // Add LinkedIn profile as a note if available
      if (linkedInProfile) {
        await addContactNote(
          accessToken,
          contact.id,
          `LinkedIn Profile: ${linkedInProfile}`
        );
      }
      
      // Add LinkedIn info as a note if available
      if (linkedInInfo) {
        const infoNote = `
LinkedIn Information:
${linkedInInfo.professionalSummary ? `Professional Summary: ${linkedInInfo.professionalSummary}` : ''}
${linkedInInfo.industryExperience ? `Industry Experience: ${linkedInInfo.industryExperience}` : ''}
${linkedInInfo.likelyFinancialInterests ? `Professional Interests: ${linkedInInfo.likelyFinancialInterests}` : ''}
        `;
        
        await addContactNote(accessToken, contact.id, infoNote);
      }
    }
    
    // If we found or created a contact, get their notes for context
    if (contact && accessToken) {
      const notes = await getContactNotes(accessToken, contact.id);
      
      return {
        id: contact.id,
        properties: contact.properties,
        notes: notes.map((note: { properties: { hs_note_body: string } }) => note.properties.hs_note_body),
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error in HubSpot contact management:', error);
    return null;
  }
};

// Add meeting note to HubSpot contact
export const addMeetingNote = async ({
  contactId,
  meetingDetails,
  answers,
}: {
  contactId: string;
  meetingDetails: {
    title: string;
    startTime: string;
    duration: number;
  };
  answers: Array<{
    questionId: string;
    originalText: string;
    enhancedText: string;
  }>;
}) => {
  try {
    // Find a HubSpot account to use
    const hubspotAccounts = await prisma.hubspotAccount.findMany();
    
    if (hubspotAccounts.length === 0) {
      console.log('No HubSpot accounts found');
      return null;
    }
    
    const accessToken = hubspotAccounts[0].accessToken;
    
    // Format the note content
    const noteContent = `
Meeting Scheduled: ${meetingDetails.title}
Time: ${new Date(meetingDetails.startTime).toLocaleString()}
Duration: ${meetingDetails.duration} minutes

Client Responses:
${answers.map(answer => {
  let text = `Q: ${answer.questionId}\nA: ${answer.originalText}`;
  
  if (answer.enhancedText && answer.enhancedText !== answer.originalText) {
    text += `\nContext: ${answer.enhancedText.replace('Context: ', '')}`;
  }
  
  return text;
}).join('\n\n')}
    `;
    
    // Add the note to the contact
    const noteResponse = await addContactNote(accessToken, contactId, noteContent);
    
    return noteResponse;
  } catch (error) {
    console.error('Error adding meeting note to HubSpot:', error);
    return null;
  }
}; 