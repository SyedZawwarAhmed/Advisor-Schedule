import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { prisma } from '@/prisma';
import { findContactByEmail, getContactNotes } from './hubspot';
import { scrapeLinkedInProfile, LinkedInScraperResponse } from './linkedin-scraper';
import { generateLinkedInFallback } from './linkedin-fallback';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

// Configure the model
const getGeminiModel = () => {
  const generationConfig = {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 1024,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  return genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig,
    safetySettings,
  });
};

interface LinkedInInfoResult {
  name?: string;
  headline?: string;
  location?: string;
  professionalSummary: string;
  industryExperience: string;
  likelyFinancialInterests: string;
  experiences?: string;
  education?: string;
  source: string;
}

// Extract information from LinkedIn URL
export const extractLinkedInInfo = async (linkedInUrl: string, email: string = ''): Promise<LinkedInInfoResult> => {
  try {
    // First try using the LinkedIn scraper
    let linkedInData;
    let usedFallback = false;
    
    try {
      // Use actual LinkedIn scraper
      linkedInData = await scrapeLinkedInProfile(linkedInUrl);
      
      // Check if there's an error in the response
      if (linkedInData.error) {
        // Scraping failed, try the fallback
        console.log(`LinkedIn scraping failed: ${linkedInData.error}. Using fallback generation.`);
        linkedInData = await generateLinkedInFallback(linkedInUrl, email);
        usedFallback = true;
      }
    } catch (scrapingError) {
      console.error('LinkedIn scraping error:', scrapingError);
      // Scraping failed with exception, use fallback
      linkedInData = await generateLinkedInFallback(linkedInUrl, email);
      usedFallback = true;
    }

    // If we still don't have valid data, return default values
    if (!linkedInData || ('error' in linkedInData && linkedInData.error)) {
      console.error('Both LinkedIn scraping and fallback failed');
      return {
        professionalSummary: 'Unable to extract professional summary from LinkedIn',
        industryExperience: 'Unknown',
        likelyFinancialInterests: 'Unknown',
        source: 'default',
      };
    }
    
    // Return formatted LinkedIn data
    if (usedFallback) {
      // We're returning fallback data
      return {
        ...linkedInData,
        source: 'ai-generated',
      };
    } else {
      // Return the actual scraped data
      return {
        name: linkedInData.name,
        headline: linkedInData.headline,
        location: linkedInData.location,
        professionalSummary: linkedInData.professionalSummary || 'No professional summary available',
        industryExperience: linkedInData.industryExperience || 'Unknown industry',
        likelyFinancialInterests: linkedInData.likelyFinancialInterests || 'General financial planning',
        experiences: Array.isArray(linkedInData.experiences) ? linkedInData.experiences.join(', ') : undefined,
        education: Array.isArray(linkedInData.education) ? linkedInData.education.join(', ') : undefined,
        source: 'linkedin-scrape',
      };
    }
  } catch (error) {
    console.error('Error extracting LinkedIn info:', error);
    return {
      professionalSummary: 'Unable to extract professional summary from LinkedIn',
      industryExperience: 'Unknown',
      likelyFinancialInterests: 'Unknown',
      source: 'error',
    };
  }
};

// Augment answer with context from Hubspot and LinkedIn
export const augmentAnswerWithContext = async ({
  question,
  answer,
  linkedInInfo,
  contactInfo
}: {
  question: string;
  answer: string;
  linkedInInfo?: any;
  contactInfo?: any;
}) => {
  try {
    let hubspotNotes: string[] = [];
    
    // Extract notes from contact info if available
    if (contactInfo && contactInfo.notes) {
      hubspotNotes = Array.isArray(contactInfo.notes) 
        ? contactInfo.notes 
        : [contactInfo.notes];
    }
    
    // No context to augment with
    if (hubspotNotes.length === 0 && !linkedInInfo) {
      return answer;
    }
    
    // Prepare context for AI
    const model = getGeminiModel();
    
    // Create a more detailed LinkedIn context if we have the extended info
    const linkedInContext = linkedInInfo 
      ? `LINKEDIN CONTEXT:
         ${linkedInInfo.name ? `Name: ${linkedInInfo.name}` : ''}
         ${linkedInInfo.headline ? `Headline: ${linkedInInfo.headline}` : ''}
         ${linkedInInfo.location ? `Location: ${linkedInInfo.location}` : ''}
         Professional Summary: ${linkedInInfo.professionalSummary || ''}
         Industry Experience: ${linkedInInfo.industryExperience || ''}
         Financial Interests: ${linkedInInfo.likelyFinancialInterests || ''}
         ${linkedInInfo.experiences ? `Experience: ${linkedInInfo.experiences}` : ''}
         ${linkedInInfo.education ? `Education: ${linkedInInfo.education}` : ''}
         ${linkedInInfo.source ? `Source: ${linkedInInfo.source}` : ''}`
      : '';
    
    const prompt = `
    You are an AI assistant that provides contextual enhancements to client responses for financial advisors.
    
    CLIENT'S QUESTION: "${question}"
    CLIENT'S ANSWER: "${answer}"
    
    ${
      hubspotNotes.length > 0
        ? `HUBSPOT NOTES CONTEXT:
           ${hubspotNotes.join('\n')}`
        : ''
    }
    
    ${linkedInContext}
    
    Based on the client's answer and the available context, identify any relevant connections, insights or potential concerns.
    Format your response to start with "Context:" followed by a concise, professional note highlighting how the client's current answer relates to previously known information.
    
    If there's no meaningful connection between the answer and the context, just respond with "No relevant context found."
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const augmentedAnswer = response.text();
    
    return augmentedAnswer === 'No relevant context found.' ? answer : augmentedAnswer;
  } catch (error) {
    console.error('Error augmenting answer with context:', error);
    return answer;
  }
}; 