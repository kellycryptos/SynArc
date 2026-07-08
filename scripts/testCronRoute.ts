import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.join(__dirname, '../.env.local') })
dotenv.config()

import { NextRequest } from 'next/server'
import { GET } from '../app/api/agent/run/route'

async function main() {
  console.log('=== Simulating Vercel Cron Job Trigger ===')
  
  // Construct a mock NextRequest pointing to the endpoint with cron=true query param
  const req = new NextRequest('http://localhost:3000/api/agent/run?cron=true', {
    method: 'GET',
    headers: {
      'x-vercel-cron': 'true' // Vercel cron header
    }
  })

  console.log('Calling GET /api/agent/run route handler...')
  const response = await GET(req)
  const data = await response.json()

  console.log('Route response status:', response.status)
  console.log('Route response data:', JSON.stringify(data, null, 2))
}

main().catch(console.error)
