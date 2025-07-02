import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Get a single health record by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  const record = await prisma.healthRecord.findUnique({
    where: { id: params.id, userId: user.id },
    include: { documents: true },
  });
  if (!record) {
    return NextResponse.json({ error: 'Health record not found' }, { status: 404 });
  }
  return NextResponse.json(record);
}

// PUT: Update a health record by ID
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  const data = await req.json();
  const { title, description, date, category } = data;
  const record = await prisma.healthRecord.update({
    where: { id: params.id, userId: user.id },
    data: { title, description, date: new Date(date), category },
  });
  return NextResponse.json(record);
}

// DELETE: Delete a health record by ID
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  await prisma.healthRecord.delete({ where: { id: params.id, userId: user.id } });
  return NextResponse.json({ success: true });
}
