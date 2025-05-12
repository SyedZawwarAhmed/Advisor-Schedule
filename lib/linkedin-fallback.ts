import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

/**
 * Generate fallback LinkedIn data when scraping fails
 * @param linkedInUrl LinkedIn profile URL
 * @returns Generated LinkedIn profile information
 */
export async function generateLinkedInFallback(linkedInUrl: string, email: string) {
  try {
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

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig,
      safetySettings,
    });

    const username = linkedInUrl.split('/').pop() || email.split('@')[0];
    
    const prompt = `
    Based on the LinkedIn profile URL: ${linkedInUrl}
    And email address: ${email}
    
    Generate a brief professional summary that would be reasonable for a financial advisory client.
    Include:
    - Professional background
    - Industry experience
    - Likely financial interests or concerns
    
    Keep it concise and professional.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return {
      name: username,
      headline: 'Professional',
      location: 'Unknown',
      professionalSummary: text || 'No professional summary available',
      industryExperience: 'Generated based on profile',
      likelyFinancialInterests: 'Generated based on profile',
      experiences: 'No experience information available',
      education: 'No education information available',
      source: 'ai-generated',
    };
  } catch (error) {
    console.error('Error generating LinkedIn fallback:', error);
    
    return {
      name: email.split('@')[0],
      headline: 'Professional',
      location: 'Unknown',
      professionalSummary: 'No LinkedIn information available',
      industryExperience: 'Unknown',
      likelyFinancialInterests: 'General financial planning',
      experiences: 'No experience information available',
      education: 'No education information available',
      source: 'ai-generated',
    };
  }
} 