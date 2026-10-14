import { NextRequest, NextResponse } from 'next/server'
import { releaseEngine } from '@/lib/agent/release-engine'

export async function POST(req: NextRequest) {
  try {
    const params = await req.json()

    const result = await releaseEngine.runReleaseCheck(params)

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('[Agent Release Error]', error)
    return NextResponse.json(
      { error: error?.message || 'Release check failed' },
      { status: 500 }
    )
  }
}
