const fs = require('fs');
const path = require('path');
const TurndownService = require('turndown');
const { JSDOM } = require('jsdom');
const matter = require('gray-matter');
const yaml = require('js-yaml');

const entriesDir = path.join(__dirname, '../dreamwidth/entries');
const outputDir = path.join(__dirname, '../src/blog/posts');

const turndownService = new TurndownService();

const commentersYmlPath = path.join(__dirname, '../commenters.yml');
let commenters = {};
if (fs.existsSync(commentersYmlPath)) {
  commenters = yaml.load(fs.readFileSync(commentersYmlPath, 'utf8')) || {};
}

fs.readdirSync(entriesDir).forEach(file => {
  if (!file.endsWith('.html')) return;

  const html = fs.readFileSync(path.join(entriesDir, file), 'utf8');
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Extract the title from <h3 class="entry-title"><a>...</a></h3>
  let title = document.querySelector('h3.entry-title a')?.textContent.trim() || 'Untitled';
  // Extract date from <span class="datetime">...</span>
  const dateText = document.querySelector('span.datetime')?.textContent.trim() || '2000-01-01';
  // Convert date to ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ) without milliseconds and without quotes
  const parsedDate = new Date(dateText);
  let date = '2000-01-01T00:00:00Z';
  if (!isNaN(parsedDate)) {
    // Remove milliseconds, keep Z
    date = parsedDate.toISOString().replace(/\.\d{3}Z$/, 'Z');
  }
  // Extract tags from <div class="tag"><ul><li><a rel="tag">...</a></li></ul></div>
  const tags = Array.from(document.querySelectorAll('div.tag ul li a[rel="tag"]')).map(a => a.textContent.trim());
  // Extract original Dreamwidth URL from <li class="entry-permalink"><a href="..."></a></li>
  const original_url = document.querySelector('li.entry-permalink a')?.getAttribute('href') || '';
  // Extract userpic src if present
  const userpic = document.querySelector('div.userpic img')?.getAttribute('src') || '';
  // Extract the article body
  const body = document.querySelector('.entry-content')?.innerHTML || '';

  const markdown = turndownService.turndown(body);

  // --- Extract and convert comments ---
  function extractComments() {
    const commentNodes = Array.from(document.querySelectorAll('div.dwexpcomment'));
    // Build a map of comment id to comment data
    const comments = {};
    commentNodes.forEach(node => {
      const id = node.id || '';
      const header = node.querySelector('.header');
      const authorEl = node.querySelector('.ljuser a');
      let authorText = authorEl ? authorEl.textContent : '';
      // Replace ext_XXXXX with mapped username if available
      if (authorText && commenters[authorText]) {
        authorText = commenters[authorText];
      }
      const author = authorEl ? `[${authorText}](${authorEl.getAttribute('href')})` : 'Anonymous';
      // Extract comment date
      const date = header ? new Date(header.getAttribute('data-time')) : new Date();
      // Extract comment content
      const content = node.querySelector('.entry-content') ? turndownService.turndown(node.querySelector('.entry-content').innerHTML) : '';
      // Add comment to the comments object
      comments[id] = { author, date, content };
    });
    return comments;
  }

  const comments = extractComments();

  const mdWithFrontMatter = matter.stringify(markdown, {
    layout: 'layouts/post.njk',
    title,
    // Write date as a Date object so gray-matter serializes it unquoted
    date: new Date(date),
    tags,
    original_url,
    userpic
  }, {delimiters: '---'});

  // Create output filename (e.g., 2020-01-01-my-title.md)
  const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const outFile = `${date.slice(0, 10)}-${safeTitle}.md`;

  fs.writeFileSync(path.join(outputDir, outFile), mdWithFrontMatter);
  console.log(`Converted: ${file} → ${outFile}`);
});