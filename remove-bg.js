const Jimp = require('jimp');

async function removeWhiteBackground(inputPath, outputPath) {
  try {
    const image = await Jimp.read(inputPath);
    
    // We iterate through all pixels
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      // Get RGBA values
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];
      
      // If the pixel is very close to white (allow some tolerance for compression artifacts)
      if (red > 240 && green > 240 && blue > 240) {
        // Set alpha to 0 (transparent)
        this.bitmap.data[idx + 3] = 0;
      }
    });

    await image.writeAsync(outputPath);
    console.log('Background removed successfully.');
  } catch (error) {
    console.error('Error removing background:', error);
  }
}

removeWhiteBackground('public/logo-icon.png', 'public/logo-icon-transparent.png');
