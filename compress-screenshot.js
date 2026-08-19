const sharp = require('sharp');
const fs = require('fs');

sharp('./screenshot.png')
  .resize(1920, null, { withoutEnlargement: true })
  .png({ quality: 80, compressionLevel: 9 })
  .toFile('./screenshot-compressed.png')
  .then(info => {
    const origSize = fs.statSync('./screenshot.png').size;
    const newSize = info.size;
    console.log(`原图: ${(origSize/1024).toFixed(0)} KB  ->  新图: ${(newSize/1024).toFixed(0)} KB (压缩${Math.round((1-newSize/origSize)*100)}%)`);
    fs.renameSync('./screenshot-compressed.png', './screenshot.png');
    console.log('screenshot.png 已更新');
  })
  .catch(err => console.error('Error:', err));
