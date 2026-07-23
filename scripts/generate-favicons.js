const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgContent = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="112" fill="#0B0F19"/>
  <rect width="512" height="512" rx="112" fill="url(#bgGradient)" opacity="0.4"/>
  
  <defs>
    <linearGradient id="bgGradient" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#2F6FFF" stop-opacity="0.3"/>
      <stop offset="50%" stop-color="#7C3AED" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#22D3EE" stop-opacity="0.3"/>
    </linearGradient>
    <linearGradient id="logoGradient" x1="64" y1="64" x2="448" y2="448" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#2F6FFF" />
      <stop offset="50%" stop-color="#38BDF8" />
      <stop offset="100%" stop-color="#22D3EE" />
    </linearGradient>
    <linearGradient id="logoGradientInner" x1="448" y1="64" x2="64" y2="448" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#22D3EE" />
      <stop offset="50%" stop-color="#A855F7" />
      <stop offset="100%" stop-color="#2F6FFF" />
    </linearGradient>
    <radialGradient id="glow" cx="256" cy="256" r="200" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#22D3EE" stop-opacity="0.4"/>
      <stop offset="50%" stop-color="#2F6FFF" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#0B0F19" stop-opacity="0"/>
    </radialGradient>
    <filter id="blurGlow" x="0" y="0" width="512" height="512" filterUnits="userSpaceOnUse">
      <feGaussianBlur stdDeviation="28"/>
    </filter>
  </defs>

  <!-- Ambient Glow Behind Hexagon -->
  <circle cx="256" cy="256" r="180" fill="url(#glow)" filter="url(#blurGlow)"/>

  <!-- Outer Hexagon -->
  <path
    d="M256 64L422.3 160V352L256 448L89.7 352V160L256 64Z"
    stroke="url(#logoGradient)"
    stroke-width="26"
    stroke-linecap="round"
    stroke-linejoin="round"
    fill="none"
  />

  <!-- Inner Hexagon -->
  <path
    d="M256 140L356.5 198V314L256 372L155.5 314V198L256 140Z"
    stroke="url(#logoGradientInner)"
    stroke-width="18"
    stroke-linecap="round"
    stroke-linejoin="round"
    fill="rgba(168, 85, 247, 0.15)"
  />

  <!-- Center Node -->
  <circle cx="256" cy="256" r="28" fill="url(#logoGradient)"/>

  <!-- Connection Lines from Center to Inner Hexagon Vertices -->
  <line x1="256" y1="256" x2="256" y2="140" stroke="url(#logoGradient)" stroke-width="14" stroke-linecap="round" opacity="0.85"/>
  <line x1="256" y1="256" x2="356.5" y2="314" stroke="url(#logoGradient)" stroke-width="14" stroke-linecap="round" opacity="0.85"/>
  <line x1="256" y1="256" x2="155.5" y2="314" stroke="url(#logoGradient)" stroke-width="14" stroke-linecap="round" opacity="0.85"/>
</svg>`;

async function generateFavicons() {
  const rootDir = path.resolve(__dirname, '..');
  const publicDir = path.join(rootDir, 'public');
  const appDir = path.join(rootDir, 'app');

  // Save SVG files
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);
  fs.writeFileSync(path.join(appDir, 'icon.svg'), svgContent);

  // Generate PNG buffers at various resolutions
  const png32 = await sharp(Buffer.from(svgContent)).resize(32, 32).png().toBuffer();
  const png48 = await sharp(Buffer.from(svgContent)).resize(48, 48).png().toBuffer();
  const png180 = await sharp(Buffer.from(svgContent)).resize(180, 180).png().toBuffer();
  const png512 = await sharp(Buffer.from(svgContent)).resize(512, 512).png().toBuffer();

  // Save PNGs
  fs.writeFileSync(path.join(publicDir, 'logo.png'), png512);
  fs.writeFileSync(path.join(publicDir, 'icon.png'), png512);
  fs.writeFileSync(path.join(publicDir, 'apple-icon.png'), png180);
  fs.writeFileSync(path.join(appDir, 'apple-icon.png'), png180);

  // Create standard ICO file containing 32x32 PNG structure
  // ICO header: 0,0 (reserved), 1,0 (type: ICO), 1,0 (number of images: 1)
  const icoHeader = Buffer.from([0, 0, 1, 0, 1, 0]);
  // ICO directory entry for 32x32 image
  const icoDirectory = Buffer.alloc(16);
  icoDirectory.writeUInt8(32, 0); // width
  icoDirectory.writeUInt8(32, 1); // height
  icoDirectory.writeUInt8(0, 2);  // color palette (0 = no palette)
  icoDirectory.writeUInt8(0, 3);  // reserved
  icoDirectory.writeUInt16LE(1, 4); // color planes
  icoDirectory.writeUInt16LE(32, 6); // bits per pixel
  icoDirectory.writeUInt32LE(png32.length, 8); // image size in bytes
  icoDirectory.writeUInt32LE(22, 12); // offset of image data (6 header + 16 dir = 22)

  const icoBuffer = Buffer.concat([icoHeader, icoDirectory, png32]);

  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(appDir, 'favicon.ico'), icoBuffer);

  console.log('Successfully generated all SynArc favicons, icons, and ICO files!');
}

generateFavicons().catch(err => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});
