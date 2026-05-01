import { NextResponse } from 'next/server'

const REMOTE_API_URL = 'https://docking-635955947416.asia-east1.run.app/api/games/'

export async function GET() {
  try {
    const response = await fetch(REMOTE_API_URL, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    })

    const text = await response.text()
    const payload = text ? JSON.parse(text) : {}

    return NextResponse.json(payload, {
      status: response.status,
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Unable to load games from upstream API.' },
      { status: 502 }
    )
  }
}
