import 'dotenv/config';
import { ensureProductTags } from '../lib/tags';

async function main() {
  console.log('Starting standalone product tag initialization...');
  
  // Ensure we are not in test environment so ensureProductTags executes
  const env = process.env as any;
  if (env.NODE_ENV === 'test') {
    env.NODE_ENV = 'development';
  }
  if (env.VITEST) {
    env.VITEST = '';
  }

  await ensureProductTags();
  console.log('Product tag initialization completed successfully.');
}

main()
  .catch((error) => {
    console.error('Error executing tag initialization:', error);
    process.exit(1);
  });
