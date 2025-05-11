import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';
import fetch from 'node-fetch';

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
 * Clean up and normalize a LinkedIn URL
 */
function normalizeLinkedInUrl(url: string): string {
  if (!url) return '';
  
  try {
    // Handle URLs with or without https
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    const linkedInUrl = new URL(url);
    
    // Ensure it's a LinkedIn URL
    if (!linkedInUrl.hostname.includes('linkedin.com')) {
      throw new Error('Not a LinkedIn URL');
    }
    
    return linkedInUrl.toString();
  } catch (error) {
    console.error('Error normalizing LinkedIn URL:', error);
    return url; // Return original URL if normalization fails
  }
}

/**
 * Extract text from a selector on the page, with fallback
 */
async function extractText(page: Page, selector: string, fallback: string = ''): Promise<string> {
  try {
    await page.waitForSelector(selector, { timeout: TIMEOUT / 3 });
    const element = await page.$(selector);
    if (element) {
      return await page.evaluate((el: Element) => el.textContent?.trim() || '', element);
    }
  } catch (error) {
    console.log(`Selector not found: ${selector}`);
  }
  return fallback;
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
 * Scrape LinkedIn profile using the external scraper service
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
    
    // Call the scraper service (Python API)
    const scraperUrl = process.env.LINKEDIN_SCRAPER_URL || 'http://localhost:8000/scrape';
    const response = await fetch(scraperUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LINKEDIN_SCRAPER_API_KEY || ''}`
      },
      body: JSON.stringify({ url: cleanUrl })
    });
    
    const data = await response.json() as LinkedInScraperResponse;
    
    // Check if there was an error
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
  // Basic check for LinkedIn URL
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    
    // Ensure it's a LinkedIn URL
    if (!urlObj.hostname.includes('linkedin.com')) {
      return null;
    }
    
    // Return sanitized URL
    return urlObj.toString();
  } catch {
    // If it's not a valid URL, try to construct one
    if (url.includes('linkedin.com')) {
      return `https://${url}`;
    }
    
    // Check if it's just a username
    if (/^[a-zA-Z0-9\-]+$/.test(url)) {
      return `https://linkedin.com/in/${url}`;
    }
    
    return null;
  }
}

/**
 * Close browser when done
 */
export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

// Handle process termination
process.on('exit', closeBrowser);
process.on('SIGINT', closeBrowser);
process.on('SIGTERM', closeBrowser); 