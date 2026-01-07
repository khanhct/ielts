import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Fake API - only allow user: ieltstester
    // Accept any password for this demo
    if (username === 'ieltstester') {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))

      return NextResponse.json({
        success: true,
        message: 'Login successful',
        user: {
          username: 'ieltstester',
        },
      })
    } else {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))

      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}

