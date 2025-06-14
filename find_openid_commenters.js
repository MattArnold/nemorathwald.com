const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const https = require('https');
const { JSDOM } = require('jsdom');

const dreamwidthDir = path.join(__dirname, 'dreamwidth');
const commentersYmlPath = path.join(__dirname, 'commenters.yml');

// Helper to get all files recursively in a directory
function getAllFiles(dir, files = []) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, files);
    } else {
      files.push(fullPath);
    }
  });
  return files;
}

// Load or initialize commenters.yml
let commenters = {};
if (fs.existsSync(commentersYmlPath)) {
  commenters = yaml.load(fs.readFileSync(commentersYmlPath, 'utf8')) || {};
}

// Find all ext_ links in dreamwidth files (href="https://www.dreamwidth.org/users/ext_XXXXX")
const extIdRegex = /href="https:\/\/www\.dreamwidth\.org\/users\/(ext_\d+)"/g;
const files = getAllFiles(dreamwidthDir);
const foundExtIds = new Set();

files.forEach(file => {
  const text = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = extIdRegex.exec(text)) !== null) {
    foundExtIds.add(match[1]);
  }
});

// Helper to fetch HTML from a URL
function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Main async function
(async () => {
  let updated = false;
  for (const extId of foundExtIds) {
    if (commenters[extId]) continue;
    // Convert ext_25108 to ext-25108.dreamwidth.org
    const subdomain = extId.replace('_', '-');
    const url = `https://${subdomain}.dreamwidth.org/`;
    console.log(`Fetching: ${url}`);
    try {
      const html = await fetchHtml(url);
      const dom = new JSDOM(html);
      // Look for <a href="http://USERNAME.livejournal.com/">
      let foundLJ = null;
      const links = dom.window.document.querySelectorAll('a[href^="http://"]');
      for (const link of links) {
        const href = link.getAttribute('href');
        const match = href.match(/^http:\/\/(.*?)\.livejournal\.com\//);
        if (match && match[1]) {
          foundLJ = match[1];
          break;
        }
      }
      if (foundLJ) {
        commenters[extId] = foundLJ;
        updated = true;
        console.log(`Mapped ${extId} → ${foundLJ}`);
      } else {
        console.log(`Could not find LiveJournal username for ${extId}`);
      }
    } catch (e) {
      console.error(`Error fetching ${url}:`, e);
    }
  }
  if (updated) {
    fs.writeFileSync(commentersYmlPath, yaml.dump(commenters));
    console.log('commenters.yml updated.');
  } else {
    console.log('No new mappings found.');
  }
})();
