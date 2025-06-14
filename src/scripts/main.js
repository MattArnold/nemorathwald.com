import '../styles/main.css';

// Tag and year filtering for blog directory
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const tagButtons = document.querySelectorAll('.tag-filter-btn[data-tag]');
    const yearButtons = document.querySelectorAll('.year-filter-btn[data-year]');
    const postItems = document.querySelectorAll('section ul > li[data-tags]');
    let activeTag = null;
    let activeYear = null;

    // Helper: get tag/year from query string
    function getParamFromQuery(param) {
      const params = new URLSearchParams(window.location.search);
      return params.get(param);
    }

    // Helper: filter posts by tag and/or year
    function filterPosts() {
      postItems.forEach(li => {
        const tags = li.getAttribute('data-tags') || '';
        const year = li.getAttribute('data-year');
        const tagMatch = !activeTag || tags.split(',').map(t => t.trim()).includes(activeTag);
        const yearMatch = !activeYear || year === activeYear;
        li.style.display = (tagMatch && yearMatch) ? '' : 'none';
      });
      tagButtons.forEach(b => b.classList.remove('bg-blue-400', 'text-white'));
      yearButtons.forEach(b => b.classList.remove('bg-blue-400', 'text-white'));
      if (activeTag) {
        tagButtons.forEach(b => {
          if (b.getAttribute('data-tag') === activeTag) {
            b.classList.add('bg-blue-400', 'text-white');
          }
        });
      }
      if (activeYear) {
        yearButtons.forEach(b => {
          if (b.getAttribute('data-year') === activeYear) {
            b.classList.add('bg-blue-400', 'text-white');
          }
        });
      }
    }

    // Helper: update query string
    function updateQuery() {
      const url = new URL(window.location);
      if (activeTag) {
        url.searchParams.set('tag', activeTag);
      } else {
        url.searchParams.delete('tag');
      }
      if (activeYear) {
        url.searchParams.set('year', activeYear);
      } else {
        url.searchParams.delete('year');
      }
      window.history.replaceState({}, '', url);
    }

    // On page load, check for ?tag= and ?year= in URL
    const initialTag = getParamFromQuery('tag');
    const initialYear = getParamFromQuery('year');
    if (initialTag) activeTag = initialTag;
    if (initialYear) activeYear = initialYear;
    if (activeTag || activeYear) filterPosts();

    tagButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tag = btn.getAttribute('data-tag');
        if (activeTag === tag) {
          activeTag = null;
        } else {
          activeTag = tag;
        }
        filterPosts();
        updateQuery();
      });
    });
    yearButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const year = btn.getAttribute('data-year');
        if (activeYear === year) {
          activeYear = null;
        } else {
          activeYear = year;
        }
        filterPosts();
        updateQuery();
      });
    });

    // Excerpt toggle logic
    const toggleExcerptsBtn = document.getElementById('toggle-excerpts-btn');
    if (toggleExcerptsBtn) {
      const excerptDivs = document.querySelectorAll('.excerpt');
      let excerptsVisible = false;
      toggleExcerptsBtn.addEventListener('click', () => {
        excerptsVisible = !excerptsVisible;
        excerptDivs.forEach(div => {
          div.classList.toggle('hidden', !excerptsVisible);
        });
        toggleExcerptsBtn.textContent = excerptsVisible ? 'Hide excerpts' : 'Show excerpts';
      });
    }
  });
}
