/**
 * Automated Cloudflare Zone & DNS Setup for syndaopro.xyz -> Vercel
 *
 * Usage:
 *   node scripts/migrate-to-cloudflare.mjs <CLOUDFLARE_API_TOKEN>
 * or set CLOUDFLARE_API_TOKEN in environment / .env
 */

const DOMAIN = 'syndaopro.xyz';
const VERCEL_IP = '76.76.21.21';
const VERCEL_CNAME = 'cname.vercel-dns.com';

const apiToken = process.env.CLOUDFLARE_API_TOKEN || process.argv[2];

if (!apiToken) {
  console.error('\n❌ ERROR: Cloudflare API Token is required.');
  console.error('Usage: node scripts/migrate-to-cloudflare.mjs <CLOUDFLARE_API_TOKEN>\n');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${apiToken.trim()}`,
  'Content-Type': 'application/json',
};

async function cfFetch(path, options = {}) {
  const url = `https://api.cloudflare.com/client/v4${path}`;
  const res = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
  const data = await res.json();
  if (!res.ok || !data.success) {
    const errMsg = data.errors?.map((e) => `[${e.code}] ${e.message}`).join(', ') || res.statusText;
    throw new Error(`Cloudflare API error (${path}): ${errMsg}`);
  }
  return data;
}

async function run() {
  console.log(`\n==================================================`);
  console.log(`🚀 Migrating ${DOMAIN} to Cloudflare (Vercel Integration)`);
  console.log(`==================================================\n`);

  // 1. Verify token
  console.log('1️⃣  Verifying Cloudflare API token...');
  const verifyRes = await cfFetch('/user/tokens/verify');
  console.log(`   Token valid! Status: ${verifyRes.result.status}`);

  // 2. Check if zone already exists first (doesn't require Account permissions)
  console.log(`\n2️⃣  Checking if zone "${DOMAIN}" already exists on Cloudflare...`);
  let zone;
  try {
    const existingZones = await cfFetch(`/zones?name=${encodeURIComponent(DOMAIN)}`);
    if (existingZones.result && existingZones.result.length > 0) {
      zone = existingZones.result[0];
      console.log(`   ✓ Zone already exists! Zone ID: ${zone.id}`);
    }
  } catch (e) {
    console.log(`   Could not query zones directly: ${e.message}`);
  }

  // 3. If zone doesn't exist, fetch account and create it
  if (!zone) {
    console.log('\n3️⃣  Zone not found. Fetching Cloudflare Account to create zone...');
    const accountsRes = await cfFetch('/accounts?page=1&per_page=5');
    if (!accountsRes.result || accountsRes.result.length === 0) {
      throw new Error('No Cloudflare accounts found for this token.');
    }
    const account = accountsRes.result[0];
    console.log(`   Using Account: "${account.name}" (${account.id})`);

    console.log(`   Creating new zone for ${DOMAIN}...`);
    const createZoneRes = await cfFetch('/zones', {
      method: 'POST',
      body: JSON.stringify({
        account: { id: account.id },
        name: DOMAIN,
        type: 'full',
      }),
    });
    zone = createZoneRes.result;
    console.log(`   ✓ Zone created successfully! Zone ID: ${zone.id}`);
  }

  const nameservers = zone.name_servers || [];
  console.log(`\n📌 Cloudflare Assigned Nameservers:`);
  nameservers.forEach((ns, i) => console.log(`   Nameserver ${i + 1}: ${ns}`));

  // 4. Configure DNS Records for Vercel
  console.log(`\n4️⃣  Checking and configuring DNS records for Vercel...`);
  const dnsRes = await cfFetch(`/zones/${zone.id}/dns_records`);
  const existingRecords = dnsRes.result || [];

  // 4a. Apex A Record (@ -> 76.76.21.21)
  const existingApex = existingRecords.find((r) => r.type === 'A' && (r.name === DOMAIN || r.name === `@.${DOMAIN}`));
  if (existingApex) {
    console.log(`   Updating existing apex A record (${existingApex.content} -> ${VERCEL_IP})...`);
    await cfFetch(`/zones/${zone.id}/dns_records/${existingApex.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        type: 'A',
        name: '@',
        content: VERCEL_IP,
        ttl: 1, // Auto
        proxied: true,
      }),
    });
    console.log(`   ✓ Apex A record updated.`);
  } else {
    console.log(`   Creating apex A record (@ -> ${VERCEL_IP})...`);
    await cfFetch(`/zones/${zone.id}/dns_records`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'A',
        name: '@',
        content: VERCEL_IP,
        ttl: 1, // Auto
        proxied: true,
      }),
    });
    console.log(`   ✓ Apex A record created.`);
  }

  // 4b. CNAME www Record (www -> cname.vercel-dns.com)
  const existingWww = existingRecords.find((r) => r.name === `www.${DOMAIN}`);
  if (existingWww) {
    console.log(`   Updating existing www CNAME record (${existingWww.content} -> ${VERCEL_CNAME})...`);
    await cfFetch(`/zones/${zone.id}/dns_records/${existingWww.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        type: 'CNAME',
        name: 'www',
        content: VERCEL_CNAME,
        ttl: 1, // Auto
        proxied: true,
      }),
    });
    console.log(`   ✓ www CNAME record updated.`);
  } else {
    console.log(`   Creating www CNAME record (www -> ${VERCEL_CNAME})...`);
    await cfFetch(`/zones/${zone.id}/dns_records`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'CNAME',
        name: 'www',
        content: VERCEL_CNAME,
        ttl: 1, // Auto
        proxied: true,
      }),
    });
    console.log(`   ✓ www CNAME record created.`);
  }

  // 5. Configure SSL/TLS Settings (Full Strict for Vercel)
  console.log(`\n5️⃣  Configuring SSL/TLS encryption mode to "Full (Strict)"...`);
  try {
    await cfFetch(`/zones/${zone.id}/settings/ssl`, {
      method: 'PATCH',
      body: JSON.stringify({ value: 'strict' }),
    });
    console.log(`   ✓ SSL encryption mode set to "Full (Strict)" (matches Vercel SSL certificates).`);
  } catch (err) {
    console.warn(`   ⚠️ SSL mode update notice: ${err.message}`);
  }

  // 6. Enable Always Use HTTPS
  console.log(`\n6️⃣  Enabling "Always Use HTTPS"...`);
  try {
    await cfFetch(`/zones/${zone.id}/settings/always_use_https`, {
      method: 'PATCH',
      body: JSON.stringify({ value: 'on' }),
    });
    console.log(`   ✓ "Always Use HTTPS" enabled.`);
  } catch (err) {
    console.warn(`   ⚠️ Always Use HTTPS update notice: ${err.message}`);
  }

  // 7. Enable Automatic HTTPS Rewrites
  console.log(`\n7️⃣  Enabling "Automatic HTTPS Rewrites"...`);
  try {
    await cfFetch(`/zones/${zone.id}/settings/automatic_https_rewrites`, {
      method: 'PATCH',
      body: JSON.stringify({ value: 'on' }),
    });
    console.log(`   ✓ Automatic HTTPS Rewrites enabled.`);
  } catch (err) {
    console.warn(`   ⚠️ Automatic HTTPS Rewrites notice: ${err.message}`);
  }

  console.log(`\n==================================================`);
  console.log(`🎉 Cloudflare Setup Completed Successfully!`);
  console.log(`==================================================\n`);
  console.log(`NEXT STEP: Delegate Nameservers on Namecheap:`);
  console.log(`1. In your Namecheap Dashboard (shown in your screenshot):`);
  console.log(`   Navigate to: Domain -> Nameservers`);
  console.log(`2. Switch from "Namecheap BasicDNS" to "Custom DNS"`);
  console.log(`3. Fill in the two Cloudflare nameservers:`);
  nameservers.forEach((ns, i) => console.log(`      Nameserver ${i + 1}: ${ns}`));
  console.log(`4. Click the green checkmark (Save Changes).`);
  console.log(`\nOnce DNS propagates (usually 2-15 minutes), Cloudflare Edge SSL will be active and`);
  console.log(`all "NET::ERR_CERT_COMMON_NAME_INVALID" errors will be completely resolved!\n`);
}

run().catch((err) => {
  console.error('\n❌ Cloudflare Migration Failed:');
  console.error(err.message || err);
  process.exit(1);
});
