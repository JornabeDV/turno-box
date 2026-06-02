import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, '../public/icons');

// Fuente: logo con fondo transparente
const logoSrc = path.join(iconsDir, 'logo_solo.png');

// Color de fondo de la app
const BG = { r: 10, g: 31, b: 42, alpha: 255 };

async function generateIcon(size, outputPath) {
  // Padding 22% → el logo ocupa ~56% del canvas, dejando margen de seguridad
  // para que no se corte en iconos circulares adaptativos de Android/iOS
  const padding = Math.round(size * 0.22);
  const logoSize = size - padding * 2;

  // Resize el logo manteniendo aspecto, con fondo transparente
  const resizedLogo = await sharp(logoSrc)
    .resize(logoSize, logoSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  // Componer sobre fondo oscuro de la app
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG,
    },
  })
    .composite([
      {
        input: resizedLogo,
        top: padding,
        left: padding,
      },
    ])
    .png()
    .toFile(outputPath);

  console.log(`Generated ${outputPath} (${size}x${size})`);
}

await generateIcon(192, path.join(iconsDir, 'icon-192.png'));
await generateIcon(512, path.join(iconsDir, 'icon-512.png'));
await generateIcon(180, path.join(iconsDir, 'apple-touch-icon.png'));

console.log('Done!');
