const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, 'src', 'blog', 'posts');
const NEW_TAGS_FILE = path.join(__dirname, 'newtags.txt');

const newTags = fs.readFileSync(NEW_TAGS_FILE, 'utf8')
  .split(/\r?\n/)
  .map(t => t.trim())
  .filter(Boolean);

let existingTags = new Set();
let posts = [];

for (const fname of fs.readdirSync(POSTS_DIR)) {
  if (!fname.endsWith('.md')) continue;
  const text = fs.readFileSync(path.join(POSTS_DIR, fname), 'utf8');
  let front = '', body = text;
  if (text.startsWith('---')) {
    const parts = text.split('---');
    front = parts[1] || '';
    body = parts.slice(2).join('---');
  }
  const lines = front.split(/\r?\n/);
  let tags = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('tags:')) {
      const rest = line.split(':', 2)[1].trim();
      if (rest.startsWith('[')) {
        const inside = rest.replace(/^[\[]|[\]]$/g, '');
        tags = inside.split(',').map(t => t.trim()).filter(Boolean);
      } else {
        i++;
        while (i < lines.length && lines[i].trim().startsWith('- ')) {
          tags.push(lines[i].trim().slice(2).trim());
          i++;
        }
        i--;
      }
      break;
    }
  }
  tags = tags.map(t => t.toLowerCase());
  tags.forEach(t => existingTags.add(t));
  posts.push({ fname, tags, body });
}

let results = {};

for (const post of posts) {
  const text = post.body
    .replace(/\[[^\]]*\]\([^\)]*\)/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .toLowerCase();
  const sugg = [];
  for (const tag of newTags) {
    const lower = tag.toLowerCase();
    if (existingTags.has(lower) || post.tags.includes(lower)) continue;
    const pattern = new RegExp('\\b' + lower.replace(/[^a-z0-9]+/g, '\\s*') + '\\b');
    if (pattern.test(text)) {
      sugg.push(tag);
    }
  }
  if (sugg.length) {
    results[post.fname] = sugg;
  }
}

let output = '';
for (const [file, tags] of Object.entries(results)) {
  output += file + ':\n';
  for (const t of tags) {
    output += '  - ' + t + '\n';
  }
}
fs.writeFileSync('tag_suggestions.yml', output);
console.log('Wrote tag_suggestions.yml');
