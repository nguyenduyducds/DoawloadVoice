// Sinh View/voices.json từ folder FolderNgonNguGiong/<ngôn ngữ>/<file audio>.
// Chạy: node tools/gen-manifest.js
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const root = 'FolderNgonNguGiong';
const rootAbs = path.join(projectRoot, root);
const out = [];

for (const lang of fs.readdirSync(rootAbs)) {
    const langDir = path.join(rootAbs, lang);
    if (!fs.statSync(langDir).isDirectory()) continue;
    for (const file of fs.readdirSync(langDir)) {
        if (!/\.(mp3|wav|m4a|ogg|flac)$/i.test(file)) continue;
        out.push({
            name: path.parse(file).name,
            language: lang,
            file: `${root}/${lang}/${file}`,
        });
    }
}

const dest = path.join(projectRoot, 'View', 'voices.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 2), 'utf-8');

const byLang = {};
out.forEach((v) => (byLang[v.language] = (byLang[v.language] || 0) + 1));
console.log(`✅ Tạo ${dest}: ${out.length} giọng`);
console.log(byLang);
