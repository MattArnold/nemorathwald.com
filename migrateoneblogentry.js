const fs = require('fs');
const path = require('path');
const TurndownService = require('turndown');
const { JSDOM } = require('jsdom');
const matter = require('gray-matter');
const yaml = require('js-yaml');

const entriesDir = path.resolve(__dirname, 'dreamwidth/entries');
const outputDir = path.resolve(__dirname, 'src/blog/posts');

const turndownService = new TurndownService();

// Only process the specific test file
const testFile = 'entry-1584.html';
const filePath = path.join(entriesDir, testFile);

const commentersYmlPath = path.join(__dirname, 'commenters.yml');
let commenters = {};
if (fs.existsSync(commentersYmlPath)) {
  commenters = yaml.load(fs.readFileSync(commentersYmlPath, 'utf8')) || {};
}

if (fs.existsSync(filePath)) {
  const html = fs.readFileSync(filePath, 'utf8');
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
      const date = header?.querySelector('.datetime span:last-child')?.textContent.trim() || '';
      const title = header?.querySelector('.comment-title')?.textContent.trim() || '';
      const bodyHtml = node.querySelector('.comment-content')?.innerHTML || '';
      const bodyMd = turndownService.turndown(bodyHtml);
      // Find parent by traversing up to closest .dwexpcomment
      let parent = null;
      let parentNode = node.parentElement;
      while (parentNode) {
        if (parentNode.classList && parentNode.classList.contains('dwexpcomment')) {
          parent = parentNode.id;
          break;
        }
        parentNode = parentNode.parentElement;
      }
      comments[id] = { id, author, date, title, bodyMd, parent, children: [] };
    });
    // Build tree
    Object.values(comments).forEach(comment => {
      if (comment.parent && comments[comment.parent]) {
        comments[comment.parent].children.push(comment);
      }
    });
    // Get top-level comments
    return Object.values(comments).filter(c => !c.parent);
  }

  function renderCommentsMd(comments) {
    let md = '';
    comments.forEach((comment, idx) => {
      if (idx > 0) md += '\n\n---\n\n';
      md += `**${comment.author}** on ${comment.date}`;
      if (comment.title) md += ` — *${comment.title}*`;
      md += `\n\n${comment.bodyMd}`;
      if (comment.children.length > 0) {
        // Render children as flat, separated by ---
        md += '\n\n---\n\n' + renderCommentsMd(comment.children).replace(/^---\n\n/, '');
      }
    });
    return md;
  }

  const commentsTree = extractComments();
  let commentsMd = '';
  // Always add Comments section, always with a break and horizontal rule after the header
  if (commentsTree.length > 0) {
    commentsMd = '\n\n## Comments\n\n---\n\n' + renderCommentsMd(commentsTree);
  } else {
    commentsMd = '\n\n## Comments\n\n---\n\nnone';
  }

  // ---
  const mdWithFrontMatter = matter.stringify(markdown + commentsMd, {
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
  console.log(`Converted: ${testFile} → ${outFile}`);
} else {
  console.log(`File not found: ${filePath}`);
}