let circleClient: any = null

export const getCircleClient = async () => {
  if (typeof window === 'undefined') return null
  if (!circleClient) {
    try {
      const { W3SSdk } = await import('@circle-fin/w3s-pw-web-sdk')
      circleClient = new W3SSdk()
    } catch (err) {
      console.error('[Circle Web SDK] Failed to instantiate SDK client:', err)
      return null
    }
  }
  return circleClient
}

export const initCircleWallet = async (userToken: string, encryptionKey: string) => {
  const client = await getCircleClient()
  if (!client) {
    throw new Error('Circle Web SDK is not supported or failed to initialize in this browser environment.')
  }
  
  const rawAppId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID;
  const appId = !rawAppId || rawAppId === 'mock_circle_app_id_123456' || rawAppId.includes('your_')
    ? '21fe3b25-388d-5cbc-a14a-e62d92a6d2d8' // Resilient fallback to configured real App ID
    : rawAppId;

  client.setAppSettings({
    appId
  })

  client.setAuthentication({
    userToken,
    encryptionKey
  })

  return client
}
