import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser } from 'puppeteer';

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

// Configuration
const TIMEOUT = 30000; // 30 seconds timeout
let browser: Browser | null = null;

/**
 * Initialize the browser if not already initialized
 */
async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });
  }
  return browser;
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

export interface LinkedInScraperResponse {
  name?: string;
  headline?: string;
  location?: string;
  professionalSummary?: string;
  industryExperience?: string;
  professionalInterests?: string;
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
  let page = null;
  
  try {
    const cleanUrl = sanitizeLinkedInUrl(linkedInUrl);
    if (!cleanUrl) {
      throw new Error('Invalid LinkedIn URL');
    }

    const browser = await getBrowser();
    page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Navigate to the profile
    await page.goto(cleanUrl, { 
      waitUntil: 'networkidle0',
      timeout: TIMEOUT 
    });
    
    // Extract profile information
    const profileData = await page.evaluate(() => {
      const name = document.querySelector('h1')?.textContent?.trim() || '';
      const headline = document.querySelector('.text-body-medium')?.textContent?.trim() || '';
      const location = document.querySelector('.text-body-small.inline.t-black--light')?.textContent?.trim() || '';
      
      return {
        name,
        headline,
        location,
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
      await page.close().catch(console.error);
    }
  }
}

// Cleanup browser on server shutdown
process.on('exit', async () => {
  if (browser) {
    await browser.close().catch(console.error);
  }
}); 