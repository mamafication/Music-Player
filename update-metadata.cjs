const fs = require('fs');
let metadata = JSON.parse(fs.readFileSync('metadata.json', 'utf8'));
metadata.name = "Music Player";
fs.writeFileSync('metadata.json', JSON.stringify(metadata, null, 2));

let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/<title>.*<\/title>/, '<title>Music Player</title>');
html = html.replace(/<meta property="og:title" content=".*" \/>/, '<meta property="og:title" content="Music Player" />');
fs.writeFileSync('index.html', html);
