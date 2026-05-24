/**
 * PWA Icon Generator Script
 *
 * This script generates all required PWA icons from a source image.
 * It uses the `sharp` library to resize and upscale images.
 *
 * Usage:
 *   node scripts/generate-pwa-icons.mjs [source-image-path] [--maskable-source <path>]
 *
 * Examples:
 *   node scripts/generate-pwa-icons.mjs                    # uses public/icon-512x512.png
 *   node scripts/generate-pwa-icons.mjs public/my-icon.png # uses custom source
 *   node scripts/generate-pwa-icons.mjs public/icon.png --maskable-source public/maskable.png
 *
 * Source image requirements:
 *   - Minimum 192x192 PNG (smaller images will be auto-upscaled to 1024x1024)
 *   - Recommended: 512x512 or 1024x1024 for best quality
 *   - No padding, full square (icon fills the entire canvas)
 *
 * For maskable icons, you can provide a separate source image with the icon
 * centered in a 1080x1080 safe zone within a 1024x1024 canvas (40px padding on each side).
 * Or use the --maskable-source flag. Without it, maskable icons are auto-generated
 * by adding 10% padding around the standard source.
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const sourcePath = args[0] || 'public/icon-512x512.png';
const maskableSourcePath = args.find((a, i) => args[i - 1] === '--maskable-source') || sourcePath;

const outputDir = 'public';
const UPSCALE_TARGET = 1024; // Intermediate upscale size for quality

// All required PWA icon sizes
const iconSizes = [
  // Standard icons (purpose: any)
  { size: 72, name: 'icon-72x72.png', purpose: 'any' },
  { size: 96, name: 'icon-96x96.png', purpose: 'any' },
  { size: 128, name: 'icon-128x128.png', purpose: 'any' },
  { size: 144, name: 'icon-144x144.png', purpose: 'any' },
  { size: 152, name: 'icon-152x152.png', purpose: 'any' },
  { size: 192, name: 'icon-192x192.png', purpose: 'any' },
  { size: 384, name: 'icon-384x384.png', purpose: 'any' },
  { size: 512, name: 'icon-512x512.png', purpose: 'any' },
  
  // Maskable icons (purpose: maskable) — icon must be centered with safe zone padding
  { size: 192, name: 'icon-192-maskable.png', purpose: 'maskable' },
  { size: 512, name: 'icon-512-maskable.png', purpose: 'maskable' },
  
  // Apple touch icons
  { size: 120, name: 'apple-touch-icon-120.png', purpose: 'apple' },
  { size: 152, name: 'apple-touch-icon-152.png', purpose: 'apple' },
  { size: 167, name: 'apple-touch-icon-167.png', purpose: 'apple' },
  { size: 180, name: 'apple-touch-icon-180.png', purpose: 'apple' },
  
  // Favicons
  { size: 16, name: 'favicon-16x16.png', purpose: 'favicon' },
  { size: 32, name: 'favicon-32x32.png', purpose: 'favicon' },
];

// Apple splash screen sizes (width x height)
const splashSizes = [
  { width: 640, height: 1136, name: 'apple-splash-640.png', device: 'iPhone SE / 5s' },
  { width: 750, height: 1334, name: 'apple-splash-750.png', device: 'iPhone 6/7/8' },
  { width: 828, height: 1792, name: 'apple-splash-828.png', device: 'iPhone XR / 11' },
  { width: 1080, height: 1920, name: 'apple-splash-1080.png', device: 'Android 540dp' },
  { width: 1125, height: 2436, name: 'apple-splash-1125.png', device: 'iPhone X/XS/11 Pro' },
  { width: 1170, height: 2532, name: 'apple-splash-1170.png', device: 'iPhone 12/13/14' },
  { width: 1242, height: 2688, name: 'apple-splash-1242.png', device: 'iPhone XS Max / 11 Pro Max' },
  { width: 1290, height: 2796, name: 'apple-splash-1290.png', device: 'iPhone 14 Pro Max' },
  { width: 1536, height: 2048, name: 'apple-splash-1536.png', device: 'iPad Mini / Air' },
  { width: 1668, height: 2224, name: 'apple-splash-1668.png', device: 'iPad Pro 10.5"' },
  { width: 2048, height: 2732, name: 'apple-splash-2048.png', device: 'iPad Pro 12.9"' },
];

async function generateIcons() {
  console.log('🧩 Sudoku Prime — PWA Icon Generator');
  console.log('=====================================\n');

  // Check source image exists
  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ Source image not found: ${sourcePath}`);
    console.log('\nPlease provide a PNG source image (minimum 192x192):');
    console.log('  node scripts/generate-pwa-icons.mjs <path-to-source-image>');
    console.log('\nTip: A 512x512 or 1024x1024 icon gives best results.');
    process.exit(1);
  }

  const sourceImage = sharp(sourcePath);
  const metadata = await sourceImage.metadata();
  console.log(`✅ Source image: ${sourcePath} (${metadata.width}x${metadata.height})`);

  if (metadata.width < 192 || metadata.height < 192) {
    console.error('❌ Source image must be at least 192x192 pixels');
    process.exit(1);
  }

  // Auto-upscale small source images to 1024x1024 for better quality output
  // This produces sharper results than upscaling directly to each target size
  let upscaledBuffer;
  let upscaledMaskableBuffer;
  const needsUpscale = metadata.width < UPSCALE_TARGET || metadata.height < UPSCALE_TARGET;

  if (needsUpscale) {
    console.log(`\n⬆️  Upscaling source from ${metadata.width}x${metadata.height} to ${UPSCALE_TARGET}x${UPSCALE_TARGET}...`);
    upscaledBuffer = await sharp(sourcePath)
      .resize(UPSCALE_TARGET, UPSCALE_TARGET, {
        fit: 'cover',
        position: 'center',
        kernel: 'lanczos3', // High-quality interpolation for upscaling
      })
      .png()
      .toBuffer();
    console.log('  ✅ Standard source upscaled');

    if (maskableSourcePath !== sourcePath) {
      upscaledMaskableBuffer = await sharp(maskableSourcePath)
        .resize(UPSCALE_TARGET, UPSCALE_TARGET, {
          fit: 'cover',
          position: 'center',
          kernel: 'lanczos3',
        })
        .png()
        .toBuffer();
      console.log('  ✅ Maskable source upscaled');
    } else {
      upscaledMaskableBuffer = upscaledBuffer;
    }
  } else {
    // Source is already large enough — read into buffer for consistent API
    upscaledBuffer = await sharp(sourcePath).png().toBuffer();
    upscaledMaskableBuffer = maskableSourcePath !== sourcePath
      ? await sharp(maskableSourcePath).png().toBuffer()
      : upscaledBuffer;
  }

  // Helper: get the correct source buffer for an icon
  const getSrcBuffer = (purpose) => purpose === 'maskable' ? upscaledMaskableBuffer : upscaledBuffer;

  // Generate standard icons
  console.log('\n📱 Generating standard icons...');
  for (const icon of iconSizes) {
    const outputPath = path.join(outputDir, icon.name);
    const srcBuffer = getSrcBuffer(icon.purpose);
    
    try {
      if (icon.purpose === 'maskable') {
        // For maskable icons, add padding (safe zone = 80% of the icon area)
        // The icon content should be within the inner 80% circle
        const padding = Math.round(icon.size * 0.1); // 10% padding on each side
        const innerSize = icon.size - 2 * padding;
        
        await sharp(srcBuffer)
          .resize(innerSize, innerSize, { fit: 'cover', position: 'center' })
          .extend({
            top: padding,
            bottom: padding,
            left: padding,
            right: padding,
            background: { r: 13, g: 17, b: 23, alpha: 1 }, // #0d1117
          })
          .png()
          .toFile(outputPath);
      } else {
        await sharp(srcBuffer)
          .resize(icon.size, icon.size, { fit: 'cover', position: 'center' })
          .png()
          .toFile(outputPath);
      }
      console.log(`  ✅ ${icon.name} (${icon.size}x${icon.size}, ${icon.purpose})`);
    } catch (err) {
      console.error(`  ❌ Failed: ${icon.name}`, err.message);
    }
  }

  // Generate apple-touch-icon.png (180x180, the default)
  try {
    await sharp(upscaledBuffer)
      .resize(180, 180, { fit: 'cover', position: 'center' })
      .png()
      .toFile(path.join(outputDir, 'apple-touch-icon.png'));
    console.log('  ✅ apple-touch-icon.png (180x180, default)');
  } catch (err) {
    console.error('  ❌ Failed: apple-touch-icon.png', err.message);
  }

  // Generate splash screens
  console.log('\n🖥️ Generating iOS splash screens...');
  console.log('  ⚠️  Splash screens use a solid background with centered icon');
  
  for (const splash of splashSizes) {
    const outputPath = path.join(outputDir, splash.name);
    const iconSize = Math.min(splash.width, splash.height) * 0.35; // Icon is 35% of screen height
    
    try {
      // Create splash screen: dark background + centered icon
      const iconBuffer = await sharp(upscaledBuffer)
        .resize(Math.round(iconSize), Math.round(iconSize), { fit: 'cover', position: 'center' })
        .png()
        .toBuffer();

      await sharp({
        create: {
          width: splash.width,
          height: splash.height,
          channels: 4,
          background: { r: 13, g: 17, b: 23, alpha: 1 }, // #0d1117
        },
      })
        .composite([
          {
            input: iconBuffer,
            top: Math.round((splash.height - iconSize) / 2),
            left: Math.round((splash.width - iconSize) / 2),
          },
        ])
        .png()
        .toFile(outputPath);
      
      console.log(`  ✅ ${splash.name} (${splash.width}x${splash.height}) — ${splash.device}`);
    } catch (err) {
      console.error(`  ❌ Failed: ${splash.name}`, err.message);
    }
  }

  // Generate screenshots for manifest
  console.log('\n📸 Generating manifest screenshots...');
  
  // Wide screenshot (1280x720) — simulate game screen
  try {
    const gameIconSize = 200;
    const iconBuffer = await sharp(upscaledBuffer)
      .resize(gameIconSize, gameIconSize, { fit: 'cover' })
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: 1280,
        height: 720,
        channels: 4,
        background: { r: 13, g: 17, b: 23, alpha: 1 },
      },
    })
      .composite([
        {
          input: iconBuffer,
          top: Math.round((720 - gameIconSize) / 2),
          left: Math.round((1280 - gameIconSize) / 2),
        },
      ])
      .png()
      .toFile(path.join(outputDir, 'screenshot-wide.png'));
    console.log('  ✅ screenshot-wide.png (1280x720)');
  } catch (err) {
    console.error('  ❌ Failed: screenshot-wide.png', err.message);
  }

  // Narrow screenshot (750x1334) — simulate mobile game screen
  try {
    const gameIconSize = 250;
    const iconBuffer = await sharp(upscaledBuffer)
      .resize(gameIconSize, gameIconSize, { fit: 'cover' })
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: 750,
        height: 1334,
        channels: 4,
        background: { r: 13, g: 17, b: 23, alpha: 1 },
      },
    })
      .composite([
        {
          input: iconBuffer,
          top: Math.round((1334 - gameIconSize) / 2),
          left: Math.round((750 - gameIconSize) / 2),
        },
      ])
      .png()
      .toFile(path.join(outputDir, 'screenshot-narrow.png'));
    console.log('  ✅ screenshot-narrow.png (750x1334)');
  } catch (err) {
    console.error('  ❌ Failed: screenshot-narrow.png', err.message);
  }

  console.log('\n✅ All icons generated! Check the public/ directory.');
  if (needsUpscale) {
    console.log('\n💡 Note: Source was upscaled from ' + metadata.width + 'x' + metadata.height +
      ' to ' + UPSCALE_TARGET + 'x' + UPSCALE_TARGET + '.');
    console.log('   For sharper icons, provide a 1024x1024 or larger source image.');
  }
  console.log('\n⚠️  For production, provide professionally designed icons:');
  console.log('   1. Create a 1024x1024 master icon (no padding, full bleed)');
  console.log('   2. Create a separate 1024x1024 maskable icon (icon centered, 40px padding)');
  console.log('   3. Run: node scripts/generate-pwa-icons.mjs <master-icon> --maskable-source <maskable-icon>');
  console.log('   4. For splash screens, consider adding your app name text below the icon');
}

generateIcons().catch(console.error);