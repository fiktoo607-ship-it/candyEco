import './load-env';
import { prisma } from '../lib/prisma';
import { sendPushNotification } from '../lib/push-notifications';

async function sendTick(count: number) {
  try {
    const subscriptions = await prisma.pushSubscription.findMany();
    if (subscriptions.length === 0) {
      console.log(`[${new Date().toLocaleTimeString()}] No active subscriptions found in DB. Waiting...`);
      return;
    }

    console.log(`[${new Date().toLocaleTimeString()}] [#${count}] Sending push notification to ${subscriptions.length} active device(s)...`);
    
    await sendPushNotification(
      { all: true },
      {
        title: 'Candy Eco Test 🍰',
        body: `Notification de test #${count} - Envoyée à ${new Date().toLocaleTimeString()}`,
        icon: '/logo.jpeg',
        url: '/',
        data: { tick: count }
      }
    );
  } catch (err: any) {
    console.error('Error during push execution:', err.message || err);
  }
}

async function main() {
  console.log('================================================');
  console.log('   Web Push Notification 8-Second Loop Script   ');
  console.log('================================================');
  console.log('This script will query database subscriptions and dispatch a');
  console.log('push notification every 8 seconds. Press Ctrl+C to stop.\n');

  let count = 1;
  
  // Trigger initial push immediately
  await sendTick(count++);

  // Repeat every 8 seconds
  const interval = setInterval(async () => {
    await sendTick(count++);
  }, 8000);

  // Graceful termination
  process.on('SIGINT', () => {
    console.log('\nStopping the loop script. Goodbye!');
    clearInterval(interval);
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Fatal unhandled error in script:', err);
});
