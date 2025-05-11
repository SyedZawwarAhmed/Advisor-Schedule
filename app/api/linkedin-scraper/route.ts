import { NextResponse } from 'next/server';
import { scrapeLinkedInProfile } from '@/lib/server/linkedin-scraper';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'LinkedIn URL is required' },
        { status: 400 }
      );
    }

    const profileData = await scrapeLinkedInProfile(url);
    
    if (profileData.error) {
      return NextResponse.json(
        { error: profileData.error },
        { status: 500 }
      );
    }

    return NextResponse.json(profileData);
  } catch (error) {
    console.error('LinkedIn scraper error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape LinkedIn profile' },
      { status: 500 }
    );
  }
} 