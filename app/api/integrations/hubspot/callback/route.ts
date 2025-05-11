import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/integrations?error=No authorization code received`
      );
    }
    
    // Exchange code for tokens
    const clientId = process.env.HUBSPOT_CLIENT_ID;
    const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/hubspot/callback`;
    
    const tokenResponse = await fetch(
      'https://api.hubapi.com/oauth/v1/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId || '',
          client_secret: clientSecret || '',
          redirect_uri: redirectUri,
          code,
        }).toString(),
      }
    );
    
    if (!tokenResponse.ok) {
      console.error('Error from HubSpot token endpoint:', await tokenResponse.text());
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/integrations?error=Failed to get access token`
      );
    }
    
    const tokens = await tokenResponse.json();
    
    // Check if user already has a HubSpot account
    const existingAccount = await prisma.hubspotAccount.findUnique({
      where: {
        userId: session.user.id,
      },
    });
    
    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);
    
    if (existingAccount) {
      // Update existing account
      await prisma.hubspotAccount.update({
        where: {
          id: existingAccount.id,
        },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt,
        },
      });
    } else {
      // Create new account
      await prisma.hubspotAccount.create({
        data: {
          userId: session.user.id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt,
        },
      });
    }
    
    // Redirect to success page
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/integrations?success=true`
    );
  } catch (error) {
    console.error('Error handling HubSpot callback:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/integrations?error=Failed to connect HubSpot`
    );
  }
} 