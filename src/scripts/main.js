import '../styles/main.css';

// Tag filtering for blog directory
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const tagButtons = document.querySelectorAll('.tag-filter-btn[data-tag]');
    const postItems = document.querySelectorAll('section ul > li[data-tags]');
    let activeTag = null;

    // Helper: get tag from query string
    function getTagFromQuery() {
      const params = new URLSearchParams(window.location.search);
      return params.get('tag');
    }

    // Helper: filter posts by tag
    function filterByTag(tag) {
      postItems.forEach(li => {
        const tags = li.getAttribute('data-tags') || '';
        if (tags.split(',').map(t => t.trim()).includes(tag)) {
          li.style.display = '';
        } else {
          li.style.display = 'none';
        }
      });
      tagButtons.forEach(b => b.classList.remove('bg-blue-400', 'text-white'));
      tagButtons.forEach(b => {
        if (b.getAttribute('data-tag') === tag) {
          b.classList.add('bg-blue-400', 'text-white');
        }
      });
      activeTag = tag;
    }

    // Helper: clear filter
    function clearFilter() {
      postItems.forEach(li => li.style.display = '');
      tagButtons.forEach(b => b.classList.remove('bg-blue-400', 'text-white'));
      activeTag = null;
    }

    // On page load, check for ?tag= in URL
    const initialTag = getTagFromQuery();
    if (initialTag) {
      filterByTag(initialTag);
    }

    tagButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tag = btn.getAttribute('data-tag');
        if (activeTag === tag) {
          clearFilter();
          // Remove tag from URL
          const url = new URL(window.location);
          url.searchParams.delete('tag');
          window.history.replaceState({}, '', url);
        } else {
          filterByTag(tag);
          // Set tag in URL
          const url = new URL(window.location);
          url.searchParams.set('tag', tag);
          window.history.replaceState({}, '', url);
        }
      });
    });
  });
}
