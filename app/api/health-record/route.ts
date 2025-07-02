import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: List all health records for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', session); // Debug log
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const records = await prisma.healthRecord.findMany({
      where: { userId: user.id },
      include: { documents: true },
      orderBy: { date: 'desc' },
    });
    
    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching health records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health records' },
      { status: 500 }
    );
  }
}

// POST: Create a new health record
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', session); // Debug log
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const data = await req.json();
    const { title, description, date, category } = data;
    
    // Validate required fields
    if (!title || !date || !category) {
      return NextResponse.json({ error: 'Missing required fields: title, date, and category are required' }, { status: 400 });
    }

    // Validate date format
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    // Validate category
    const validCategories = ['symptoms', 'medications', 'appointments', 'lab_results'];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }
    
    const record = await prisma.healthRecord.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        date: dateObj,
        category,
        userId: user.id,
      },
    });
    
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating health record:', error);
    return NextResponse.json(
      { error: 'Failed to create health record' },
      { status: 500 }
    );
  }
}
