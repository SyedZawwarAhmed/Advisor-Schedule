import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

export async function GET() {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const hubspotAccount = await prisma.hubspotAccount.findUnique({
      where: {
        userId: session.user.id,
      },
    });
    
    return NextResponse.json({
      isConnected: !!hubspotAccount,
      account: hubspotAccount ? {
        createdAt: hubspotAccount.createdAt,
        updatedAt: hubspotAccount.updatedAt,
      } : null,
    });
  } catch (error) {
    console.error('Error checking HubSpot status:', error);
    return NextResponse.json(
      { error: 'Failed to check HubSpot status' },
      { status: 500 }
    );
  }
} 