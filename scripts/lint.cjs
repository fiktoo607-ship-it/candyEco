#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
let errorCount = 0;
let warningCount = 0;

function reportError(file, line, rule, message) {
  const relPath = path.relative(ROOT_DIR, file);
  console.error(`  \x1b[31merror\x1b[0m ${message} (${rule}) at ${relPath}:${line}`);
  errorCount++;
}

function reportWarning(file, line, rule, message) {
  const relPath = path.relative(ROOT_DIR, file);
  console.warn(`  \x1b[33mwarning\x1b[0m ${message} (${rule}) at ${relPath}:${line}`);
  warningCount++;
}

// 1. Lint next.config.mjs (Cache-Control & Headers for static assets)
function lintNextConfig() {
  const configFile = path.join(ROOT_DIR, 'next.config.mjs');
  if (!fs.existsSync(configFile)) return;
  const content = fs.readFileSync(configFile, 'utf8');

  if (!content.includes('/images/:path*')) {
    reportError(
      configFile,
      1,
      'next/require-image-cache-control',
      'Missing static image cache control headers for /images/:path*'
    );
  }
}

// 2. Lint Toast component (Issue #125)
function lintToast() {
  const toastFile = path.join(ROOT_DIR, 'components', 'Toast.tsx');
  if (!fs.existsSync(toastFile)) return;
  const content = fs.readFileSync(toastFile, 'utf8');

  if (!content.includes('aria-live=')) {
    reportError(toastFile, 1, 'a11y/toast-aria-live', 'Toast must declare an aria-live region');
  }
  if (!content.includes('role=')) {
    reportError(toastFile, 1, 'a11y/toast-role', 'Toast must declare an accessible role (status/alert)');
  }
}

// 3. Lint Critical Accessibility and UI Components (Issue #124, #26, #58)
const AUDITED_COMPONENTS = [
  'components/Toast.tsx',
  'components/site-header.tsx',
  'components/cart/CheckoutForm.tsx',
  'components/product-details/ProductDetails.tsx',
  'components/our-product/ProductBrowser.tsx',
  'components/dashbord/DeleteModal.tsx',
  'components/dashbord/helpers/DashboardDeleteModal.tsx',
  'components/dashbord/DeliverySection.tsx',
  'components/dashbord/helpers/DeliverySectionHelpers.tsx',
  'components/dashbord/helpers/QnaSectionHelpers.tsx',
  'components/dashbord/ProductModal.tsx',
  'components/dashbord/orders/OrderStatusConfirmModal.tsx',
  'components/dashbord/orders/OrderDetailsModal.tsx',
  'components/dashbord/users/FidelityConfigModal.tsx',
  'components/dashbord/cms/SlideModal.tsx',
];

function lintAuditedComponents() {
  for (const relPath of AUDITED_COMPONENTS) {
    const fullPath = path.join(ROOT_DIR, relPath);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('material-symbols-outlined') || line.includes('material-icons')) {
        // Look within line and adjacent lines for aria-hidden
        const surrounding = lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 3)).join(' ');
        if (!surrounding.includes('aria-hidden="true"') && !surrounding.includes("aria-hidden='true'")) {
          reportError(
            fullPath,
            i + 1,
            'a11y/no-unhidden-icon-ligatures',
            'Material Symbols icon must have aria-hidden="true"'
          );
        }
      }
    }
  }
}

console.log('\x1b[36mRunning Next.js Code, Cache Headers & Accessibility Linter...\x1b[0m');
lintNextConfig();
lintToast();
lintAuditedComponents();

if (errorCount > 0) {
  console.error(`\n\x1b[31m✖ Lint check failed with ${errorCount} error(s) and ${warningCount} warning(s).\x1b[0m\n`);
  process.exit(1);
} else {
  console.log(`\n\x1b[32m✔ Lint check passed: 0 errors, 0 warnings. All quality & accessibility checks passed.\x1b[0m\n`);
  process.exit(0);
}
