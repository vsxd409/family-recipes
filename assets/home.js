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
  const activeTags = new Set();

  const normalizeTag = value => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();

  const textCompare = (a, b) => a.localeCompare(b, undefined, {
    sensitivity: 'base',
    numeric: true
  });

  // The former category preset buttons are now represented as ordinary tags.
  document.querySelector('.filters')?.remove();

  // Add a clear contribution path beside the recipe count without changing the static homepage markup.
  const countBadge = document.querySelector('.count-badge');
  if (countBadge && !document.querySelector('.contribute-link')) {
    const actions = document.createElement('div');
    actions.className = 'home-actions';
    countBadge.parentNode.insertBefore(actions, countBadge);
    actions.appendChild(countBadge);

    const contribute = document.createElement('a');
    contribute.className = 'contribute-link';
    contribute.href = 'contribute.html';
    contribute.textContent = '+ Contribute a recipe';
    actions.appendChild(contribute);
  }

  // Recipe metadata updates that should appear on the homepage immediately.
  const chiliCard = cards.find(card => card.getAttribute('href') === 'recipes/crockpot-chili.html');
  if (chiliCard) {
    chiliCard.dataset.updated = '2026-10-17';

    const updatedTag = [...chiliCard.querySelectorAll('.record-tag')]
      .find(tag => tag.textContent.trim().startsWith('Updated:'));
    if (updatedTag) {
      updatedTag.innerHTML = 'Updated: <time datetime="2026-10-17">Oct 17, 2026</time>';
    }

    const tagHost = chiliCard.querySelector('.rtags');
    if (tagHost) {
      const hasStory = [...tagHost.querySelectorAll('.tag')]
        .some(tag => normalizeTag(tag.textContent) === 'has story');
      if (!hasStory) {
        const storyTag = document.createElement('span');
        storyTag.className = 'tag';
        storyTag.textContent = 'Has story';
        tagHost.appendChild(storyTag);
      }
    }
  }

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

  // Created and Updated remain visible metadata, but they are no longer filter tags.
  // Source remains filterable because it is useful across multiple recipes.
  cards.forEach(card => {
    [...card.querySelectorAll('.record-tag')].forEach(tag => {
      const isSource = tag.textContent.trim().startsWith('Source:');
      tag.dataset.filterable = isSource ? 'true' : 'false';
    });
  });

  // Flag recipes that were actually revised after creation within the past 30 days.
  // This tag expires automatically as the update gets older.
  const now = new Date();
  cards.forEach(card => {
    const createdText = card.dataset.created;
    const updatedText = card.dataset.updated;
    if (!createdText || !updatedText) return;

    const created = new Date(`${createdText}T00:00:00`);
    const updated = new Date(`${updatedText}T00:00:00`);
    const ageDays = (now - updated) / 86400000;
    const isRecentRevision = updated > created && ageDays >= 0 && ageDays <= 30;
    if (!isRecentRevision) return;

    const tagHost = card.querySelector('.rtags');
    if (!tagHost) return;
    const exists = [...tagHost.querySelectorAll('.tag')]
      .some(tag => normalizeTag(tag.textContent) === 'recently updated');
    if (!exists) {
      const recentTag = document.createElement('span');
      recentTag.className = 'tag';
      recentTag.textContent = 'Recently updated';
      tagHost.appendChild(recentTag);
    }
  });

  function filterableCardTags(card) {
    return [
      ...card.querySelectorAll('.tag'),
      ...card.querySelectorAll('.record-tag[data-filterable="true"]')
    ];
  }

  function cardTags(card) {
    return filterableCardTags(card)
      .map(tag => tag.textContent.trim())
      .filter(Boolean);
  }

  // Build a left-hand browse panel from descriptive tags and sources only.
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
    <div class="tag-panel-help">Choose one or more tags to narrow the recipes. Dates stay visible on each recipe and remain available in Sort by.</div>
    <div class="tag-cloud"></div>
    <button class="clear-tag-filter" type="button" hidden>Clear tag filters</button>
  `;

  const tagCloud = tagPanel.querySelector('.tag-cloud');
  uniqueTags.forEach(label => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cloud-tag tag-filterable';
    button.textContent = label;
    button.dataset.tag = normalizeTag(label);
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('title', `Add or remove “${label}” from the recipe filters`);
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

  function cardHasActiveTags(card) {
    if (!activeTags.size) return true;
    const tags = new Set(cardTags(card).map(normalizeTag));
    return [...activeTags].every(tag => tags.has(tag));
  }

  function allFilterableTags() {
    return [
      ...document.querySelectorAll('.recipe-card .tag'),
      ...document.querySelectorAll('.recipe-card .record-tag[data-filterable="true"]'),
      ...document.querySelectorAll('.cloud-tag')
    ];
  }

  function updateTagState() {
    allFilterableTags().forEach(tag => {
      const value = tag.dataset.tag || normalizeTag(tag.textContent);
      const selected = activeTags.has(value);
      tag.classList.toggle('tag-filter-active', selected);
      tag.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });

    clearTagButton.hidden = activeTags.size === 0;
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
      const okTags = cardHasActiveTags(card);
      const visible = okQ && okTags;

      card.style.display = visible ? 'grid' : 'none';
      if (visible) shown++;
    });

    empty.style.display = shown ? 'none' : 'block';
    updateTagState();
  }

  function toggleTagFilter(value) {
    const normalized = normalizeTag(value);
    if (activeTags.has(normalized)) activeTags.delete(normalized);
    else activeTags.add(normalized);
    applyFilters();
  }

  // Descriptive tags and Source are clickable. Created/Updated remain display-only metadata.
  const tileFilterTags = [
    ...document.querySelectorAll('.recipe-card .tag'),
    ...document.querySelectorAll('.recipe-card .record-tag[data-filterable="true"]')
  ];

  tileFilterTags.forEach(tag => {
    tag.classList.add('tag-filterable');
    tag.setAttribute('role', 'button');
    tag.setAttribute('tabindex', '0');
    tag.setAttribute('aria-pressed', 'false');
    tag.setAttribute('title', `Add or remove “${tag.textContent.trim()}” from the recipe filters`);

    tag.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      toggleTagFilter(tag.textContent);
    });

    tag.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      event.stopPropagation();
      toggleTagFilter(tag.textContent);
    });
  });

  tagCloud.querySelectorAll('.cloud-tag').forEach(tag => {
    tag.addEventListener('click', () => toggleTagFilter(tag.dataset.tag));
  });

  clearTagButton.addEventListener('click', () => {
    activeTags.clear();
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
    if (event.key === 'Escape' && activeTags.size) {
      activeTags.clear();
      applyFilters();
    }
  });

  // Default presentation: alphabetical by displayed recipe name.
  sortCards();
  applyFilters();
})();
