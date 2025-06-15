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

    // --- Clear filters button logic ---
    const clearFiltersDiv = document.getElementById('clear-filters');
    const clearYearBtn = document.getElementById('clear-year-btn');
    const clearTagBtn = document.getElementById('clear-tag-btn');

    function updateClearButtons() {
      if (!clearYearBtn || !clearTagBtn || !clearFiltersDiv) {
        console.warn('[Filter UI] Missing clear filter button(s) in DOM:', {
          clearYearBtn, clearTagBtn, clearFiltersDiv
        });
        return;
      }
      // Show clear buttons if a filter is active, regardless of post visibility
      if (activeYear) {
        clearYearBtn.textContent = `Clear ${activeYear}`;
        clearYearBtn.classList.remove('hidden');
      } else {
        clearYearBtn.classList.add('hidden');
      }
      if (activeTag) {
        clearTagBtn.textContent = `Clear ${activeTag}`;
        clearTagBtn.classList.remove('hidden');
      } else {
        clearTagBtn.classList.add('hidden');
      }
      // Always show the clear-filters div if any filter is active, even if no posts are visible
      if (activeTag || activeYear) {
        clearFiltersDiv.classList.remove('hidden');
      } else {
        clearFiltersDiv.classList.add('hidden');
      }
    }

    // Update clear buttons on filter change
    function filterPostsAndUpdateButtons() {
      filterPosts();
      updateClearButtons();
    }

    // Initial state
    updateClearButtons();

    // Patch filter event handlers to update clear buttons
    tagButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tag = btn.getAttribute('data-tag');
        console.log('[TAG BUTTON CLICKED]', tag, 'activeTag before:', activeTag);
        if (activeTag === tag) {
          activeTag = null;
        } else {
          activeTag = tag;
        }
        console.log('activeTag after:', activeTag);
        filterPostsAndUpdateButtons();
        updateQuery();
      });
    });
    yearButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const year = btn.getAttribute('data-year');
        console.log('[YEAR BUTTON CLICKED]', year, 'activeYear before:', activeYear);
        if (activeYear === year) {
          activeYear = null;
        } else {
          activeYear = year;
        }
        console.log('activeYear after:', activeYear);
        filterPostsAndUpdateButtons();
        updateQuery();
      });
    });

    // Clear year
    clearYearBtn.addEventListener('click', () => {
      activeYear = null;
      filterPostsAndUpdateButtons();
      updateQuery();
    });
    // Clear tag
    clearTagBtn.addEventListener('click', () => {
      activeTag = null;
      filterPostsAndUpdateButtons();
      updateQuery();
    });

    // Excerpt toggle logic
    const toggleExcerptsBtn = document.getElementById('toggle-excerpts-btn');
    if (toggleExcerptsBtn) {
      const excerptDivs = document.querySelectorAll('.excerpt');
      const longExcerptDivs = document.querySelectorAll('.long-excerpt');
      let excerptsVisible = false;
      toggleExcerptsBtn.addEventListener('click', () => {
        excerptsVisible = !excerptsVisible;
        excerptDivs.forEach(div => {
          div.classList.toggle('hidden', !excerptsVisible);
        });
        longExcerptDivs.forEach(div => {
          div.classList.add('hidden');
        });
        toggleExcerptsBtn.textContent = excerptsVisible ? 'Hide excerpts' : 'Show excerpts';
      });
    }

    // Per-post excerpt/long-excerpt toggle
    document.querySelectorAll('.excerpt .more-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        const excerptDiv = btn.closest('.excerpt');
        const longExcerptDiv = excerptDiv.parentElement.querySelector('.long-excerpt');
        excerptDiv.classList.add('hidden');
        if (longExcerptDiv) longExcerptDiv.classList.remove('hidden');
      });
    });
    document.querySelectorAll('.long-excerpt .less-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        const longExcerptDiv = btn.closest('.long-excerpt');
        const excerptDiv = longExcerptDiv.parentElement.querySelector('.excerpt');
        longExcerptDiv.classList.add('hidden');
        if (excerptDiv) excerptDiv.classList.remove('hidden');
      });
    });
  });
}
