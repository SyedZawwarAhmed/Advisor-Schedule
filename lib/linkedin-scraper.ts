export interface LinkedInScraperResponse {
  name?: string;
  headline?: string;
  location?: string;
  professionalSummary?: string;
  industryExperience?: string;
  likelyFinancialInterests?: string;
  experiences?: string[];
  education?: string[];
  error?: string;
  source?: string;
}

/**
 * Scrape LinkedIn profile using the internal API route
 * @param linkedInUrl LinkedIn profile URL
 * @returns Structured data from the LinkedIn profile
 */
export async function scrapeLinkedInProfile(linkedInUrl: string): Promise<LinkedInScraperResponse> {
  try {
    // Clean and validate the LinkedIn URL
    const cleanUrl = sanitizeLinkedInUrl(linkedInUrl);
    if (!cleanUrl) {
      throw new Error('Invalid LinkedIn URL');
    }
    
    // Call the internal API route
    const response = await fetch('/api/linkedin-scraper', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: cleanUrl })
    });
    
    const data = await response.json() as LinkedInScraperResponse;
    
    if (!response.ok || data.error) {
      return {
        error: data.error || `Failed to scrape LinkedIn profile: ${response.statusText}`
      };
    }
    
    return data;
  } catch (error) {
    console.error('LinkedIn scraper error:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred while scraping LinkedIn profile'
    };
  }
}

/**
 * Sanitize and validate LinkedIn URL
 */
function sanitizeLinkedInUrl(url: string): string | null {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    
    if (!urlObj.hostname.includes('linkedin.com')) {
      return null;
    }
    
    return urlObj.toString();
  } catch {
    if (url.includes('linkedin.com')) {
      return `https://${url}`;
    }
    
    if (/^[a-zA-Z0-9\-]+$/.test(url)) {
      return `https://linkedin.com/in/${url}`;
    }
    
    return null;
  }
} 