import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/prisma';

export async function GET() {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const accounts = await prisma.calendarAccount.findMany({
      where: {
        userId: session.user.id,
        provider: 'google',
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
    
    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Error fetching calendar accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar accounts' },
      { status: 500 }
    );
  }
} 