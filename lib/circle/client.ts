import { W3SSdk } from '@circle-fin/w3s-pw-web-sdk'

let circleClient: W3SSdk | null = null

export const getCircleClient = () => {
  if (typeof window === 'undefined') return null
  if (!circleClient) {
    circleClient = new W3SSdk()
  }
  return circleClient
}

export const initCircleWallet = async (userToken: string, encryptionKey: string) => {
  const client = getCircleClient()
  if (!client) {
    throw new Error('Circle Web SDK can only be initialized on the client side.')
  }
  
  client.setAppSettings({
    appId: process.env.NEXT_PUBLIC_CIRCLE_APP_ID!
  })

  client.setAuthentication({
    userToken,
    encryptionKey
  })

  return client
}
