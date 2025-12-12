import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session-token')?.value

    if (sessionToken) {
      // Delete session from database
      await db.session.deleteMany({
        where: { token: sessionToken }
      })
    }

    // Clear cookie
    const response = NextResponse.json({ message: 'Logged out successfully' })
    response.cookies.set('session-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}