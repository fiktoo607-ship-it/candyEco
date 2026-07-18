import './load-env';
import { prisma } from '../lib/prisma';

async function main() {
  console.log('================================================');
  console.log('       Web Push Orders Simulation Test          ');
  console.log('================================================');
  
  // Find a product in database to use for order creation
  const product = await prisma.product.findFirst();
  if (!product) {
    console.error('Error: No products found in your database. Please seed or add at least one product first.');
    process.exit(1);
  }
  
  console.log(`Using product: "${product.title}" (ID: ${product.id})`);
  
  const orderIds: string[] = [];
  const totalOrders = 10;
  
  for (let i = 1; i <= totalOrders; i++) {
    console.log(`[${i}/${totalOrders}] [${new Date().toLocaleTimeString()}] Submitting mock order #${i}...`);
    
    try {
      // POST to our local API endpoint to trigger full validation, SSE, and Web Push notifications
      const res = await fetch('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: `Client Simulation #${i}`,
          customerPhone: '0612345678',
          customerEmail: 'test-simulation@example.com',
          shippingAddress: '123 Avenue de Simulation, Paris',
          deliveryMethod: 'Livraison standard',
          sessionId: `sim-session-${Date.now()}-${i}`,
          items: [
            { productId: product.id, quantity: 1 }
          ]
        })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      
      const orderData = await res.json();
      console.log(`   └─> Success! Order ID: ${orderData.id}, Reference: ${orderData.reference}`);
      orderIds.push(orderData.id);
    } catch (err: any) {
      console.error(`   └─> Failed to create order:`, err.message || err);
    }
    
    // Wait 5 seconds before submitting the next order
    if (i < totalOrders) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  console.log('\nAll 10 orders have been submitted and notifications sent.');
  console.log('Waiting 10 seconds before cleaning up database...');
  await new Promise((resolve) => setTimeout(resolve, 10000));
  
  console.log(`Deleting ${orderIds.length} simulated order(s) from database...`);
  
  try {
    // Delete the simulated orders. cascade onDelete takes care of OrderItem and OrderNotification.
    const deleteResult = await prisma.order.deleteMany({
      where: {
        id: { in: orderIds }
      }
    });
    console.log(`Successfully pruned ${deleteResult.count} order records from database.`);
  } catch (err: any) {
    console.error('Error during cleanup:', err.message || err);
  }
  
  console.log('\nSimulation test completed successfully!');
}

main().catch((err) => {
  console.error('Unhandled fatal error in simulation:', err);
});
