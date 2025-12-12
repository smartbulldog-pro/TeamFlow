import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createWorkspaceSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().optional(),
  icon: z.string().optional(),
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
    const { name, description, icon } = createWorkspaceSchema.parse(body)

    // Create workspace
    const workspace = await db.workspace.create({
      data: {
        name,
        description,
        icon,
      }
    })

    // Add user as owner
    await db.workspaceMember.create({
      data: {
        userId: session.user.id,
        workspaceId: workspace.id,
        role: 'OWNER',
      }
    })

    // Create default board
    const board = await db.board.create({
      data: {
        name: 'General',
        workspaceId: workspace.id,
      }
    })

    // Create default columns
    await db.column.createMany({
      data: [
        { name: 'To Do', boardId: board.id, position: 0 },
        { name: 'In Progress', boardId: board.id, position: 1 },
        { name: 'Done', boardId: board.id, position: 2 },
      ]
    })

    return NextResponse.json({ workspace }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create workspace error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
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

    // Get user's workspaces
    const workspaces = await db.workspace.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              }
            }
          }
        },
        boards: {
          include: {
            columns: {
              include: {
                cards: {
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
                  },
                  orderBy: {
                    position: 'asc'
                  }
                }
              },
              orderBy: {
                position: 'asc'
              }
            }
          }
        },
        _count: {
          select: {
            members: true,
            boards: true,
          }
        }
      }
    })

    return NextResponse.json({ workspaces })
  } catch (error) {
    console.error('Get workspaces error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}