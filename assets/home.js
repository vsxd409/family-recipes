(() => {
  const head = document.head;
  if (head && !head.querySelector('link[rel~="icon"]')) {
    const svg = document.createElement('link');
    svg.rel = 'icon';
    svg.type = 'image/svg+xml';
    svg.href = 'favicon.svg';
    head.appendChild(svg);
  }

  const search = document.getElementById('search');
  const filters = [...document.querySelectorAll('[data-filter]')];
  const cardsHost = document.querySelector('.cards');
  const cards = [...document.querySelectorAll('.recipe-card')];
  const empty = document.getElementById('empty');
  const sortBy = document.getElementById('sortBy');
  const sortDirection = document.getElementById('sortDirection');
  const tagElements = [...document.querySelectorAll('.recipe-card .tag, .recipe-card .record-tag')];

  let cat = 'all';
  let direction = 'asc';
  let activeTag = '';

  const normalizeTag = value => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();

  const textCompare = (a, b) => a.localeCompare(b, undefined, {
    sensitivity: 'base',
    numeric: true
  });

  function sortValue(card, key) {
    if (key === 'created' || key === 'updated') return card.dataset[key] || '';
    return (card.dataset[key] || '').trim();
  }

  function updateDirectionLabel() {
    const key = sortBy.value;
    const dateSort = key === 'created' || key === 'updated';

    if (dateSort) {
      sortDirection.textContent = direction === 'asc' ? 'Oldest → Newest' : 'Newest → Oldest';
      sortDirection.setAttribute(
        'aria-label',
        direction === 'asc' ? 'Currently oldest to newest; change to newest to oldest' : 'Currently newest to oldest; change to oldest to newest'
      );
    } else {
      sortDirection.textContent = direction === 'asc' ? 'A → Z' : 'Z → A';
      sortDirection.setAttribute(
        'aria-label',
        direction === 'asc' ? 'Currently A to Z; change to Z to A' : 'Currently Z to A; change to A to Z'
      );
    }

    sortDirection.dataset.direction = direction;
  }

  function sortCards() {
    const key = sortBy.value;
    const multiplier = direction === 'asc' ? 1 : -1;

    cards.sort((a, b) => {
      const primary = textCompare(sortValue(a, key), sortValue(b, key));
      if (primary !== 0) return primary * multiplier;

      // Keep ties predictable—alphabetical by the displayed recipe name.
      return textCompare(a.dataset.name || '', b.dataset.name || '');
    });

    cards.forEach(card => cardsHost.appendChild(card));
    updateDirectionLabel();
  }

  function cardHasActiveTag(card) {
    if (!activeTag) return true;
    return [...card.querySelectorAll('.tag, .record-tag')]
      .some(tag => normalizeTag(tag.textContent) === activeTag);
  }

  function updateTagState() {
    tagElements.forEach(tag => {
      const selected = !!activeTag && normalizeTag(tag.textContent) === activeTag;
      tag.classList.toggle('tag-filter-active', selected);
      tag.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
  }

  function applyFilters() {
    const q = (search.value || '').trim().toLowerCase();
    let shown = 0;

    cards.forEach(card => {
      const haystack = [
        card.dataset.name,
        card.dataset.search,
        card.dataset.source,
        card.dataset.category,
        card.dataset.created,
        card.dataset.updated
      ].filter(Boolean).join(' ').toLowerCase();

      const okCat = cat === 'all' || card.dataset.category === cat;
      const okQ = !q || haystack.includes(q);
      const okTag = cardHasActiveTag(card);
      const visible = okCat && okQ && okTag;

      card.style.display = visible ? 'grid' : 'none';
      if (visible) shown++;
    });

    empty.style.display = shown ? 'none' : 'block';
    updateTagState();
  }

  function toggleTagFilter(tag) {
    const value = normalizeTag(tag.textContent);
    activeTag = activeTag === value ? '' : value;
    applyFilters();
  }

  tagElements.forEach(tag => {
    tag.classList.add('tag-filterable');
    tag.setAttribute('role', 'button');
    tag.setAttribute('tabindex', '0');
    tag.setAttribute('aria-pressed', 'false');
    tag.setAttribute('title', `Filter recipes by “${tag.textContent.trim()}”`);

    tag.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      toggleTagFilter(tag);
    });

    tag.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      event.stopPropagation();
      toggleTagFilter(tag);
    });
  });

  filters.forEach(button => button.addEventListener('click', () => {
    cat = button.dataset.filter;
    filters.forEach(other => other.classList.toggle('active', other === button));
    applyFilters();
  }));

  search.addEventListener('input', applyFilters);

  sortBy.addEventListener('change', () => {
    sortCards();
    applyFilters();
  });

  sortDirection.addEventListener('click', () => {
    direction = direction === 'asc' ? 'desc' : 'asc';
    sortCards();
    applyFilters();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && activeTag) {
      activeTag = '';
      applyFilters();
    }
  });

  // Default presentation: alphabetical by displayed recipe name.
  sortCards();
  applyFilters();
})();
