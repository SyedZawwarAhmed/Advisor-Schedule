# LinkedIn Scraper API

This is an alternative LinkedIn scraper implementation using Python and Playwright. Use this when the JavaScript Puppeteer implementation doesn't work in your environment.

## Setup

1. Create a Python virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Install Playwright browsers:
```bash
playwright install chromium
```

## Running the API

Start the API server:
```bash
python api.py
```

The server will be available at http://localhost:8000

## API Endpoints

- `POST /scrape` - Scrape a LinkedIn profile
  - Request body:
    ```json
    {
      "url": "https://www.linkedin.com/in/username",
      "email": "user@example.com"  // Optional
    }
    ```
  - Response: LinkedIn profile data

- `GET /health` - Health check endpoint

## Integrating with the Node.js Application

To use this Python API with the main application, update the `extractLinkedInInfo` function in `lib/ai-enhancement.ts` to make a REST API call to this service instead of using Puppeteer directly.

Example integration code:
```typescript
export const extractLinkedInInfo = async (linkedInUrl: string, email: string = '') => {
  try {
    // Call the Python API instead of using Puppeteer directly
    const response = await fetch('http://localhost:8000/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: linkedInUrl,
        email,
      }),
    });

    if (!response.ok) {
      throw new Error(`LinkedIn scraping API error: ${response.status}`);
    }

    const linkedInData = await response.json();
    
    return {
      ...linkedInData,
      source: 'python-scraper',
    };
  } catch (error) {
    console.error('Error calling LinkedIn scraper API:', error);
    // Fall back to the AI-based approach
    return generateLinkedInFallback(linkedInUrl, email);
  }
}
``` 