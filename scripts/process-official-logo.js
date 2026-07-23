const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const uploadedLogoPath = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\648a4830-4594-42c0-95bf-b918bf391f24\\.user_uploaded\\media__1784828601647.png';

async function processOfficialLogo() {
  const rootDir = path.resolve(__dirname, '..');
  const publicDir = path.join(rootDir, 'public');
  const appDir = path.join(rootDir, 'app');

  if (!fs.existsSync(uploadedLogoPath)) {
    throw new Error(`Uploaded logo image not found at ${uploadedLogoPath}`);
  }

  console.log('Reading official uploaded logo from:', uploadedLogoPath);

  // Resize and optimize for different output formats
  // 512x512 PNG logo mark
  const png512 = await sharp(uploadedLogoPath)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // 180x180 Apple Touch Icon
  const png180 = await sharp(uploadedLogoPath)
    .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // 48x48 Favicon PNG
  const png48 = await sharp(uploadedLogoPath)
    .resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // 32x32 Favicon PNG for ICO
  const png32 = await sharp(uploadedLogoPath)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // Build binary ICO containing 32x32 PNG structure
  const icoHeader = Buffer.from([0, 0, 1, 0, 1, 0]);
  const icoDirectory = Buffer.alloc(16);
  icoDirectory.writeUInt8(32, 0); // width
  icoDirectory.writeUInt8(32, 1); // height
  icoDirectory.writeUInt8(0, 2);  // color palette
  icoDirectory.writeUInt8(0, 3);  // reserved
  icoDirectory.writeUInt16LE(1, 4); // color planes
  icoDirectory.writeUInt16LE(32, 6); // bits per pixel
  icoDirectory.writeUInt32LE(png32.length, 8); // size
  icoDirectory.writeUInt32LE(22, 12); // offset

  const icoBuffer = Buffer.concat([icoHeader, icoDirectory, png32]);

  // Save to public and app directories
  fs.writeFileSync(path.join(publicDir, 'logo.png'), png512);
  fs.writeFileSync(path.join(publicDir, 'icon.png'), png512);
  fs.writeFileSync(path.join(publicDir, 'apple-icon.png'), png180);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);

  fs.writeFileSync(path.join(appDir, 'apple-icon.png'), png180);
  fs.writeFileSync(path.join(appDir, 'favicon.ico'), icoBuffer);

  // Copy uploaded logo directly as public/official-logo.png for UI components
  fs.copyFileSync(uploadedLogoPath, path.join(publicDir, 'official-logo.png'));

  console.log('Successfully updated all favicon, icon, and logo files with the official SynArc logo!');
}

processOfficialLogo().catch(err => {
  console.error('Error processing logo:', err);
  process.exit(1);
});
