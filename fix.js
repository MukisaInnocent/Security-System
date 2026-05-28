const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if(file.endsWith('.tsx')) results.push(file);
    }
  });
  return results;
}
const files = walk('./frontend/src/app');
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('className="modal"')) {
    let newContent = content.replace(/ style={{ maxWidth: '[^']+'(?:, [^}]+)? }}/g, '');
    newContent = newContent.replace(/ style={{ maxWidth: "[^"]+"(?:, [^}]+)? }}/g, '');
    newContent = newContent.replace(/ style={{ maxWidth: `[^`]+`(?:, [^}]+)? }}/g, '');
    
    // specifically target: style={{ maxWidth: '600px' }}
    newContent = newContent.replace(/ style={{ maxWidth: '600px' }}/g, '');
    newContent = newContent.replace(/style={{ maxWidth: '600px' }}/g, '');
    
    // Replace standalone maxWidth styles that might be slightly different
    newContent = newContent.replace(/style=\{\{ maxWidth: '[0-9]+px' \}\}/g, '');
    newContent = newContent.replace(/style=\{\{ maxWidth: '[0-9]+px', padding: '[0-9]+rem' \}\}/g, '');

    if (newContent !== content) {
      fs.writeFileSync(f, newContent);
      console.log('Fixed', f);
    }
  }
});
