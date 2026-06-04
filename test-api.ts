const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('🚀 Starting API Endpoint Tests...');

  // 1. Test GET /api/products
  console.log('\n--- 1. Testing GET /api/products ---');
  const getRes = await fetch(`${BASE_URL}/api/products`);
  if (!getRes.ok) {
    throw new Error(`GET /api/products failed with status ${getRes.status}`);
  }
  const products = await getRes.json();
  console.log(`✅ GET /api/products succeeded! Found ${products.length} products.`);

  // 2. Test POST /api/products
  console.log('\n--- 2. Testing POST /api/products ---');
  const newProductData = {
    title: 'كعكة الاختبار الفريدة',
    slug: 'unique-test-cake',
    category: 'كعك',
    price: '$10.00',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600',
    description: 'كعكة لذيذة تم إنشاؤها لغرض اختبار نقطة النهاية.',
    story: 'قصة كعكة الاختبار الفريدة المليئة بالتفاصيل والنكهات.',
    limitBay: 5,
    state: 'exist',
    publishedAt: new Date().toISOString()
  };

  const postRes = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newProductData),
  });

  if (postRes.status !== 201) {
    throw new Error(`POST /api/products failed with status ${postRes.status}`);
  }
  const createdProduct = (await postRes.json()) as any;
  console.log('✅ POST /api/products succeeded!');
  console.log(`   Created ID: ${createdProduct.id}`);
  const testId = createdProduct.id;

  // 3. Test GET /api/products/[id]
  console.log(`\n--- 3. Testing GET /api/products/${testId} ---`);
  const getOneRes = await fetch(`${BASE_URL}/api/products/${testId}`);
  if (!getOneRes.ok) {
    throw new Error(`GET /api/products/${testId} failed with status ${getOneRes.status}`);
  }
  const product = (await getOneRes.json()) as any;
  console.log('✅ GET /api/products/[id] succeeded!');
  console.log(`   Retrieved Title: ${product.title}`);

  // 4. Test PUT /api/products/[id]
  console.log(`\n--- 4. Testing PUT /api/products/${testId} ---`);
  const updateData = {
    title: 'كعكة الاختبار المعدلة',
    price: '$12.00',
  };

  const putRes = await fetch(`${BASE_URL}/api/products/${testId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  });

  if (!putRes.ok) {
    throw new Error(`PUT /api/products/${testId} failed with status ${putRes.status}`);
  }
  const updatedProduct = (await putRes.json()) as any;
  console.log('✅ PUT /api/products/[id] succeeded!');
  console.log(`   Updated Title: ${updatedProduct.title}`);
  console.log(`   Updated Price: ${updatedProduct.price}`);

  // 5. Test DELETE /api/products/[id]
  console.log(`\n--- 5. Testing DELETE /api/products/${testId} ---`);
  const deleteRes = await fetch(`${BASE_URL}/api/products/${testId}`, {
    method: 'DELETE',
  });

  if (!deleteRes.ok) {
    throw new Error(`DELETE /api/products/${testId} failed with status ${deleteRes.status}`);
  }
  const deleteResult = (await deleteRes.json()) as any;
  console.log('✅ DELETE /api/products/[id] succeeded!');
  console.log(`   Message: ${deleteResult.message}`);

  // 6. Verify DELETE by fetching again (should be 404)
  console.log(`\n--- 6. Verifying DELETE by fetching /api/products/${testId} again ---`);
  const verifyRes = await fetch(`${BASE_URL}/api/products/${testId}`);
  if (verifyRes.status === 404) {
    console.log('✅ Verification succeeded! Product was successfully deleted (returned 404).');
  } else {
    throw new Error(`Product still exists or returned unexpected status ${verifyRes.status}`);
  }

  console.log('\n🎉 All API endpoint tests passed successfully!');
}

runTests().catch((error) => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
