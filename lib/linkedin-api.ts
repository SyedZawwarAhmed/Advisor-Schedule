import { LinkedInScraperResponse } from './linkedin-scraper';

interface LinkedInAPIConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
}

interface LinkedInProfileResponse {
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
  profilePicture?: {
    displayImage: string;
  };
  headline?: {
    localized: {
      en_US: string;
    };
  };
  location?: {
    name: {
      localized: {
        en_US: string;
      };
    };
  };
}

export class LinkedInAPI {
  private config: LinkedInAPIConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: LinkedInAPIConfig) {
    this.config = config;
  }

  private async getAccessToken(): Promise<string> {
    // If we have a valid token, return it
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Get new token using authorization code flow
    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: process.env.LINKEDIN_AUTH_CODE || '',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get LinkedIn access token');
    }

    const data: LinkedInTokenResponse = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);
    return this.accessToken;
  }

  private extractPersonId(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const username = pathParts[pathParts.length - 1];
      
      // Note: In a real implementation, you would need to use the LinkedIn Profile API
      // to convert the public identifier to a person ID. This is just a placeholder.
      return username;
    } catch {
      return null;
    }
  }

  async getProfile(url: string): Promise<LinkedInScraperResponse> {
    try {
      const personId = this.extractPersonId(url);
      if (!personId) {
        throw new Error('Invalid LinkedIn URL');
      }

      const accessToken = await this.getAccessToken();
      const response = await fetch(`https://api.linkedin.com/v2/people/(id:${personId})`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('LinkedIn API error response:', errorData);
        throw new Error(`Failed to fetch LinkedIn profile: ${response.status} ${response.statusText}`);
      }

      const profile: LinkedInProfileResponse = await response.json();
      console.log('LinkedIn profile response:', profile);

      return {
        name: `${profile.localizedFirstName} ${profile.localizedLastName}`,
        headline: profile.headline?.localized.en_US,
        location: profile.location?.name.localized.en_US,
        professionalSummary: profile.headline?.localized.en_US || '',
        industryExperience: 'Unknown', // Not available in basic profile
        source: 'linkedin-api',
      };
    } catch (error) {
      console.error('LinkedIn API error:', error);
      return {
        error: error instanceof Error ? error.message : 'Failed to fetch LinkedIn profile',
        source: 'linkedin-api',
      };
    }
  }
} 