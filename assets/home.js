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
  const cardsHost = document.querySelector('.cards');
  const cards = [...document.querySelectorAll('.recipe-card')];
  const empty = document.getElementById('empty');
  const sortBy = document.getElementById('sortBy');
  const sortDirection = document.getElementById('sortDirection');

  let direction = 'asc';
  let activeTag = '';

  const normalizeTag = value => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();

  const textCompare = (a, b) => a.localeCompare(b, undefined, {
    sensitivity: 'base',
    numeric: true
  });

  // The former category preset buttons are now represented as ordinary tags.
  document.querySelector('.filters')?.remove();

  // Make sure each recipe's category is also represented by a visible tag.
  cards.forEach(card => {
    const category = (card.dataset.category || '').trim();
    const tagHost = card.querySelector('.rtags');
    if (!category || !tagHost) return;

    const alreadyPresent = [...tagHost.querySelectorAll('.tag')]
      .some(tag => normalizeTag(tag.textContent) === normalizeTag(category));

    if (!alreadyPresent) {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = category;
      tagHost.prepend(tag);
    }
  });

  function cardTags(card) {
    return [...card.querySelectorAll('.tag, .record-tag')]
      .map(tag => tag.textContent.trim())
      .filter(Boolean);
  }

  // Build a left-hand browse panel from every unique tag currently on the recipe cards.
  const uniqueTags = [...new Map(
    cards.flatMap(card => cardTags(card))
      .map(label => [normalizeTag(label), label])
  ).values()].sort(textCompare);

  const browseLayout = document.createElement('div');
  browseLayout.className = 'browse-layout';

  const tagPanel = document.createElement('aside');
  tagPanel.className = 'tag-panel';
  tagPanel.setAttribute('aria-label', 'Browse recipes by tag');
  tagPanel.innerHTML = `
    <div class="tag-panel-title">Browse tags</div>
    <div class="tag-panel-help">Choose a tag to show matching recipes. Choose it again to clear.</div>
    <div class="tag-cloud"></div>
    <button class="clear-tag-filter" type="button" hidden>Clear tag filter</button>
  `;

  const tagCloud = tagPanel.querySelector('.tag-cloud');
  uniqueTags.forEach(label => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cloud-tag tag-filterable';
    button.textContent = label;
    button.dataset.tag = normalizeTag(label);
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('title', `Filter recipes by “${label}”`);
    tagCloud.appendChild(button);
  });

  const results = document.createElement('div');
  results.className = 'recipe-results';
  cardsHost.parentNode.insertBefore(browseLayout, cardsHost);
  browseLayout.appendChild(tagPanel);
  browseLayout.appendChild(results);
  results.appendChild(cardsHost);
  results.appendChild(empty);

  const clearTagButton = tagPanel.querySelector('.clear-tag-filter');

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
    return cardTags(card).some(label => normalizeTag(label) === activeTag);
  }

  function allFilterableTags() {
    return [...document.querySelectorAll('.recipe-card .tag, .recipe-card .record-tag, .cloud-tag')];
  }

  function updateTagState() {
    allFilterableTags().forEach(tag => {
      const value = tag.dataset.tag || normalizeTag(tag.textContent);
      const selected = !!activeTag && value === activeTag;
      tag.classList.toggle('tag-filter-active', selected);
      tag.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });

    clearTagButton.hidden = !activeTag;
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
        card.dataset.updated,
        ...cardTags(card)
      ].filter(Boolean).join(' ').toLowerCase();

      const okQ = !q || haystack.includes(q);
      const okTag = cardHasActiveTag(card);
      const visible = okQ && okTag;

      card.style.display = visible ? 'grid' : 'none';
      if (visible) shown++;
    });

    empty.style.display = shown ? 'none' : 'block';
    updateTagState();
  }

  function setTagFilter(value) {
    const normalized = normalizeTag(value);
    activeTag = activeTag === normalized ? '' : normalized;
    applyFilters();
  }

  // Tile tags remain clickable while the card itself still opens normally elsewhere.
  document.querySelectorAll('.recipe-card .tag, .recipe-card .record-tag').forEach(tag => {
    tag.classList.add('tag-filterable');
    tag.setAttribute('role', 'button');
    tag.setAttribute('tabindex', '0');
    tag.setAttribute('aria-pressed', 'false');
    tag.setAttribute('title', `Filter recipes by “${tag.textContent.trim()}”`);

    tag.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      setTagFilter(tag.textContent);
    });

    tag.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      event.stopPropagation();
      setTagFilter(tag.textContent);
    });
  });

  tagCloud.querySelectorAll('.cloud-tag').forEach(tag => {
    tag.addEventListener('click', () => setTagFilter(tag.dataset.tag));
  });

  clearTagButton.addEventListener('click', () => {
    activeTag = '';
    applyFilters();
  });

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
