import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

// Get auth URL for HubSpot OAuth
export async function GET(request: Request) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/hubspot/callback`;
    const clientId = process.env.HUBSPOT_CLIENT_ID;
    
    // Generate HubSpot OAuth URL with correct scopes
    const authUrl = `https://app.hubspot.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=crm.objects.contacts.read%20crm.objects.contacts.write`;
    
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error generating HubSpot auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    );
  }
}

// Save HubSpot OAuth credentials
export async function POST(request: Request) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { accessToken, refreshToken, expiresAt } = body;
    
    if (!accessToken || !refreshToken || !expiresAt) {
      return NextResponse.json(
        { error: 'All token information is required' },
        { status: 400 }
      );
    }
    
    // Check if user already has a HubSpot account
    const existingAccount = await prisma.hubspotAccount.findUnique({
      where: {
        userId: session.user.id,
      },
    });
    
    if (existingAccount) {
      // Update existing account
      await prisma.hubspotAccount.update({
        where: {
          id: existingAccount.id,
        },
        data: {
          accessToken,
          refreshToken,
          expiresAt: new Date(expiresAt),
        },
      });
    } else {
      // Create new account
      await prisma.hubspotAccount.create({
        data: {
          userId: session.user.id,
          accessToken,
          refreshToken,
          expiresAt: new Date(expiresAt),
        },
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'HubSpot account connected successfully',
    });
  } catch (error) {
    console.error('Error connecting HubSpot:', error);
    return NextResponse.json(
      { error: 'Failed to connect HubSpot' },
      { status: 500 }
    );
  }
} 