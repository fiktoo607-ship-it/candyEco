import './load-env';
import { prisma } from '../lib/prisma';
import { sendPushNotification } from '../lib/push-notifications';

async function main() {
  console.log('--- Web Push Verification Script ---');
  
  // Verify environment variables are loaded
  const pubKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privKey = process.env.VAPID_PRIVATE_KEY;
  
  if (!pubKey || !privKey) {
    console.error('Error: VAPID environment variables not found. Please verify .env file.');
    process.exit(1);
  }
  
  console.log(`VAPID Public Key: ${pubKey.substring(0, 20)}...`);
  console.log(`VAPID Private Key: ${privKey.substring(0, 10)}...`);

  if (!prisma) {
    console.error('Error: Prisma client could not be loaded.');
    process.exit(1);
  }

  // Query all subscriptions in the database
  const subscriptions = await prisma.pushSubscription.findMany({
    include: {
      user: {
        select: {
          email: true,
          role: true,
        }
      }
    }
  });

  console.log(`Found ${subscriptions.length} active subscription(s) in the database:`);
  
  if (subscriptions.length === 0) {
    console.log('\n[Warning] No active push subscriptions found in the database.');
    console.log('Please open the app in your browser, ensure you subscribe via usePushNotifications, and run this script again.');
    process.exit(0);
  }

  for (const sub of subscriptions) {
    console.log(`- ID: ${sub.id}`);
    console.log(`  Endpoint: ${sub.endpoint.substring(0, 50)}...`);
    console.log(`  Associated User: ${sub.user?.email || 'Guest'}`);
    console.log(`  Device/Session Token: ${sub.deviceToken || 'None'}`);
    console.log('---------------------------------------------');
  }

  // Trigger notification to all active subscriptions
  console.log('Sending test push notification to ALL subscriptions...');
  await sendPushNotification(
    { all: true },
    {
      title: 'Vérification Candy Eco 🍰',
      body: 'Félicitations ! Votre système de push notification fonctionne à merveille !',
      icon: '/logo.jpeg',
      url: '/',
      data: { test: true }
    }
  );

  console.log('Notification sent successfully. Check your browser/system notifications.');
}

main()
  .catch((err) => {
    console.error('Unhandled error in script:', err);
  })
  .finally(() => {
    process.exit(0);
  });
