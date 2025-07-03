import webpush from 'web-push'

// Set VAPID keys (in a real app, these would be environment variables)
const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
    'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U',
  privateKey: process.env.VAPID_PRIVATE_KEY || 
    'Xt4mrV_5wXdUKO5rE9UwUoHiNC9Oi4wK3mQtw1Hd0XA'
}

webpush.setVapidDetails(
  'mailto:support@phrm-diag.com', // Use your contact email
  vapidKeys.publicKey,
  vapidKeys.privateKey
)

interface PushSubscription {
  endpoint: string
  keys: {
    auth: string
    p256dh: string
  }
  expirationTime?: number | null
}

interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: any
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

/**
 * Send a push notification to a specific subscription
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload
) {
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    )
    return { success: true }
  } catch (error: any) {
    console.error('Error sending push notification:', error)
    
    // Check if subscription is expired or invalid
    if (error.statusCode === 404 || error.statusCode === 410) {
      return { 
        success: false, 
        expired: true,
        error: error.message
      }
    }
    
    return { 
      success: false,
      error: error.message
    }
  }
}

/**
 * Send a push notification to multiple subscriptions
 * Returns an array of results with status for each subscription
 */
export async function sendPushNotificationToMany(
  subscriptions: PushSubscription[],
  payload: NotificationPayload
) {
  const results = await Promise.all(
    subscriptions.map(async (subscription) => {
      const result = await sendPushNotification(subscription, payload)
      return {
        endpoint: subscription.endpoint,
        ...result
      }
    })
  )
  
  return results
}

/**
 * Send a push notification to a specific user (all their devices)
 * In a real implementation, you would fetch the user's subscriptions from the database
 */
export async function sendPushNotificationToUser(
  userId: string,
  payload: NotificationPayload
) {
  // Mock implementation - in a real app you would get the user's subscriptions from the database
  // const subscriptions = await prisma.pushSubscription.findMany({
  //   where: { userId }
  // })
  
  // For now, we'll just log it
  console.log(`Would send notification to user ${userId}:`, payload)
  
  return { success: true, sent: 0 }
}
