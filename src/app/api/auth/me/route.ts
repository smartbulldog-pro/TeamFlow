import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            timezone: true,
            createdAt: true,
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    return NextResponse.json({ user: session.user })
  } catch (error) {
    console.error('Me endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}