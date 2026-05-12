import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, '../public/icons');

// Fuente: ícono 512 original (antes de correr el script)
const logoSrc = path.join(iconsDir, 'image-original.png');

async function generateIcon(size, outputPath) {
  // Padding 15% → el logo ocupa ~70% del canvas
  const padding = Math.round(size * 0.15);
  const logoSize = size - padding * 2;
  // Radio de esquinas: ~12% del tamaño del logo
  const radius = Math.round(logoSize * 0.12);

  // Resize el logo original manteniendo aspecto
  const resizedLogo = await sharp(logoSrc)
    .resize(logoSize, logoSize, {
      fit: 'contain',
      background: { r: 26, g: 26, b: 26, alpha: 255 },
    })
    .png()
    .toBuffer();

  // Máscara SVG con esquinas redondeadas
  const mask = Buffer.from(
    `<svg width="${logoSize}" height="${logoSize}">
      <rect x="0" y="0" width="${logoSize}" height="${logoSize}" rx="${radius}" ry="${radius}" fill="white"/>
    </svg>`
  );

  // Aplicar máscara al logo → esquinas redondeadas
  const roundedLogo = await sharp(resizedLogo)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // Componer sobre fondo blanco
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 255 },
    },
  })
    .composite([
      {
        input: roundedLogo,
        top: padding,
        left: padding,
      },
    ])
    .png()
    .toFile(outputPath);

  console.log(`Generated ${outputPath}`);
}

await generateIcon(192, path.join(iconsDir, 'image.png'));
await generateIcon(512, path.join(iconsDir, 'image.png'));
await generateIcon(180, path.join(iconsDir, 'apple-touch-icon.png'));

console.log('Done!');
