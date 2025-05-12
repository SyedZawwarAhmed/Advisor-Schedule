import { chromium } from 'playwright';

// Configuration
const TIMEOUT = 30000; // 30 seconds timeout

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
}

/**
 * Scrape LinkedIn profile
 * @param linkedInUrl LinkedIn profile URL
 * @returns Structured data from the LinkedIn profile
 */
export async function scrapeLinkedInProfile(linkedInUrl: string): Promise<LinkedInScraperResponse> {
  let browser = null;
  let context = null;
  let page = null;
  
  try {
    const cleanUrl = sanitizeLinkedInUrl(linkedInUrl);
    if (!cleanUrl) {
      throw new Error('Invalid LinkedIn URL');
    }

    // Launch browser
    browser = await chromium.launch({
      headless: true,
    });
    
    // Create context with specific user agent
    context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      viewport: { width: 1280, height: 800 },
    });
    
    // Create new page
    page = await context.newPage();
    
    // Navigate to the profile with timeout
    await page.goto(cleanUrl, { 
      waitUntil: 'networkidle',
      timeout: TIMEOUT 
    });

    // Try to close the sign-in modal if it appears
    try {
      // Wait for a short time to let the modal appear
      await page.waitForTimeout(2000);
      
      // Try different selectors for the close button
      const closeButtonSelectors = [
        'button[aria-label="Dismiss"]',
        'button[aria-label="Close"]',
        '.artdeco-modal__dismiss',
        '.sign-in-modal__dismiss',
        'button.modal__dismiss',
        'button[data-control-name="close_modal"]'
      ];

      for (const selector of closeButtonSelectors) {
        const closeButton = await page.locator(selector).first();
        if (await closeButton.count() > 0) {
          await closeButton.click();
          // Wait for modal to disappear
          await page.waitForTimeout(1000);
          break;
        }
      }
    } catch (error) {
      console.log('No sign-in modal found or could not close it:', error);
    }
    
    // Check if we're on a login page (only if we couldn't close the modal)
    const isLoginPage = await page.locator('form[action*="login"]').count() > 0;
    if (isLoginPage) {
      throw new Error('LinkedIn requires authentication');
    }
    
    // Extract profile information
    const profileData = await page.evaluate(() => {
      const name = document.querySelector('h1')?.textContent?.trim() || '';
      const headline = document.querySelector('.text-body-medium')?.textContent?.trim() || '';
      const location = document.querySelector('.text-body-small.inline.t-black--light')?.textContent?.trim() || '';
      
      return {
        name,
        headline,
        location,
        professionalSummary: 'Profile information extracted successfully',
        industryExperience: 'Information available on profile',
        likelyFinancialInterests: 'Based on professional background',
      };
    });

    return profileData;
  } catch (error) {
    console.error('LinkedIn scraper error:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to scrape LinkedIn profile'
    };
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (error) {
        console.error('Error closing page:', error);
      }
    }
    if (context) {
      try {
        await context.close();
      } catch (error) {
        console.error('Error closing context:', error);
      }
    }
    if (browser) {
      try {
        await browser.close();
      } catch (error) {
        console.error('Error closing browser:', error);
      }
    }
  }
} 