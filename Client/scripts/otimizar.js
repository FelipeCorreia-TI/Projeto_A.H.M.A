const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Resolve os caminhos a partir da pasta onde o script está salvo
const inputDir = path.resolve(__dirname, '../assets/images');
const outputDir = path.resolve(__dirname, '../assets/images-optimized');

// Criar pasta de saída se não existir
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.readdir(inputDir, async (err, files) => {
  if (err) {
    console.error('❌ Erro ao ler a pasta:', err);
    return;
  }

  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();

    if (validExtensions.includes(ext)) {
      const inputFilePath = path.join(inputDir, file);
      const fileNameWithoutExt = path.basename(file, path.extname(file));
      const outputFilePath = path.join(outputDir, `${fileNameWithoutExt}.webp`);

      try {
        await sharp(inputFilePath)
          .webp({ quality: 75 })
          .toFile(outputFilePath);

        console.log(`✅ Otimizado: ${file} -> ${fileNameWithoutExt}.webp`);
      } catch (error) {
        console.error(`❌ Erro ao converter ${file}:`, error);
      }
    }
  }
});