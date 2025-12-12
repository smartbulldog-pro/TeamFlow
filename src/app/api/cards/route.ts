import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createCardSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
  columnId: z.string(),
  assigneeId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session-token')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Find session with user
    const session = await db.session.findUnique({
      where: { 
        token: sessionToken,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: true
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, description, priority, dueDate, columnId, assigneeId } = createCardSchema.parse(body)

    // Get the highest position in the column
    const lastCard = await db.card.findFirst({
      where: { columnId },
      orderBy: { position: 'desc' }
    })

    const newPosition = lastCard ? lastCard.position + 1 : 0

    // Create card
    const card = await db.card.create({
      data: {
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        columnId,
        creatorId: session.user.id,
        assigneeId,
        position: newPosition,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            avatar: true,
          }
        }
      }
    })

    return NextResponse.json({ card }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create card error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session-token')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Find session with user
    const session = await db.session.findUnique({
      where: { 
        token: sessionToken,
        expiresAt: {
          gt: new Date()
        }
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { cardId, columnId, position } = body

    if (!cardId || !columnId || position === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Update card position and column
    const card = await db.card.update({
      where: { id: cardId },
      data: {
        columnId,
        position,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            avatar: true,
          }
        }
      }
    })

    return NextResponse.json({ card })
  } catch (error) {
    console.error('Update card error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}