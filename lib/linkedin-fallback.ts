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
      model: 'gemini-pro',
      generationConfig,
      safetySettings,
    });

    const username = linkedInUrl.split('/').pop() || email.split('@')[0];
    
    const prompt = `
    You are an AI that extracts professional information from LinkedIn profiles.
    The goal is to provide a plausible professional summary based on limited information.
    
    For the LinkedIn profile with username/URL: ${linkedInUrl}
    And email address: ${email}
    
    Generate a professional summary that would be reasonable for a financial advisory client.
    Include these sections:
    1. Professional background
    2. Industry experience
    3. Likely financial interests or concerns
    
    Format it as a structured JSON object with these keys: 
    {
      "name": "Likely full name based on username and email",
      "headline": "Plausible job title",
      "location": "City, State/Country",
      "about": "Brief professional summary",
      "professionalSummary": "Concise career overview",
      "industryExperience": "Primary industry",
      "likelyFinancialInterests": "Financial planning interests",
      "experiences": [
        {
          "company": "Company name",
          "title": "Job title",
          "duration": "Time period"
        }
      ],
      "education": [
        {
          "school": "University name",
          "degree": "Degree type",
          "fieldOfStudy": "Field",
          "dates": "Year range"
        }
      ]
    }
    
    Make the data realistic but generic, since we don't have actual information.
    Respond ONLY with the JSON object, no additional text.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const data = JSON.parse(text);
      return {
        ...data,
        fallbackGenerated: true, // Mark this as generated data
      };
    } catch (error) {
      console.error('Failed to parse AI-generated LinkedIn data:', error);
      throw new Error('Invalid LinkedIn data format');
    }
  } catch (error) {
    console.error('Error generating LinkedIn fallback:', error);
    
    // Return very basic fallback if AI generation fails
    return {
      name: email.split('@')[0],
      headline: 'Professional',
      location: 'Unknown',
      about: '',
      professionalSummary: 'No LinkedIn information available',
      industryExperience: 'Unknown',
      likelyFinancialInterests: 'General financial planning',
      experiences: [],
      education: [],
      fallbackGenerated: true,
    };
  }
} 