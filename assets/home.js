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
  const textCompare = (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true });

  document.querySelector('.filters')?.remove();

  const intro = document.querySelector('.home-hero .sub');
  if (intro) {
    intro.textContent = 'These are the recipes that have found their way through our family kitchens — the favorites we make again and again, the handwritten cards tucked in drawers, the old printouts with notes in the margins, and the dishes that come with a story. I hope this can be a place to keep those recipes and memories together, share them with one another, and make sure they are not lost along the way. If you have a family recipe, an old card or photo, or simply a memory about something we have always eaten together, please send it along. The more of us who add to this collection, the more it will feel like ours.';
  }

  function addRecipeCard({href, name, source, category, searchText, icon, description, tags, created='2026-10-17', updated='2026-10-17'}) {
    if (cards.some(card => card.getAttribute('href') === href)) return;
    const card = document.createElement('a');
    card.className = 'recipe-card';
    card.href = href;
    card.dataset.name = name;
    card.dataset.created = created;
    card.dataset.updated = updated;
    card.dataset.source = source;
    card.dataset.category = category;
    card.dataset.search = searchText;
    card.innerHTML = `
      <div class="ricon">${icon}</div>
      <div>
        <div class="rtitle">${name}</div>
        <div class="rdesc">${description}</div>
        <div class="rmeta">
          <span class="record-tag">Source: ${source}</span>
          <span class="record-tag">Created: <time datetime="${created}">Oct 17, 2026</time></span>
          <span class="record-tag">Updated: <time datetime="${updated}">Oct 17, 2026</time></span>
        </div>
        <div class="rtags">${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>
      </div>
      <div class="arrow">→</div>`;
    cards.push(card);
    cardsHost.appendChild(card);
  }

  addRecipeCard({
    href: 'recipes/mug-scrambler.html',
    name: 'Easy French Toast Egg Mug Scrambler',
    source: 'Family cookbook',
    category: 'Breakfast',
    searchText: 'easy french toast egg mug scrambler leo favorite breakfast microwave cinnamon swirl bread turkey sausage fresh eggs egg beaters maple syrup barnes noble cookbook kid friendly',
    icon: '🍳',
    description: "A quick cinnamon-bread, turkey-sausage, egg, and maple breakfast made in a mug — and Leo's favorite.",
    tags: ['Breakfast', 'Microwave', 'Cookbook', "Leo's favorite", 'Has story', 'Variations']
  });

  addRecipeCard({
    href: 'recipes/overnight-white-bread.html',
    name: 'Overnight White Bread',
    source: 'Ken Forkish',
    category: 'Breads',
    searchText: 'overnight white bread ken forkish flour water salt yeast artisan bread dutch oven pandemic michael handwritten one loaf weeknight long fermentation',
    icon: '🥖',
    description: 'A long-fermented artisan white bread made with exactly four ingredients: flour, water, salt, and yeast.',
    tags: ['Breads', 'Artisan bread', 'Overnight', 'Dutch oven', 'Cookbook', 'Handwritten notes', 'Has story', 'Variations']
  });

  const countBadge = document.querySelector('.count-badge');
  if (countBadge) countBadge.textContent = `${cards.length} recipes`;
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

  const chiliCard = cards.find(card => card.getAttribute('href') === 'recipes/crockpot-chili.html');
  if (chiliCard) {
    chiliCard.dataset.updated = '2026-10-17';
    const updatedTag = [...chiliCard.querySelectorAll('.record-tag')]
      .find(tag => tag.textContent.trim().startsWith('Updated:'));
    if (updatedTag) updatedTag.innerHTML = 'Updated: <time datetime="2026-10-17">Oct 17, 2026</time>';

    const tagHost = chiliCard.querySelector('.rtags');
    if (tagHost && ![...tagHost.querySelectorAll('.tag')].some(tag => normalizeTag(tag.textContent) === 'has story')) {
      const storyTag = document.createElement('span');
      storyTag.className = 'tag';
      storyTag.textContent = 'Has story';
      tagHost.appendChild(storyTag);
    }
  }

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

  cards.forEach(card => {
    [...card.querySelectorAll('.record-tag')].forEach(tag => {
      const isSource = tag.textContent.trim().startsWith('Source:');
      tag.dataset.filterable = isSource ? 'true' : 'false';
    });
  });

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
    if (![...tagHost.querySelectorAll('.tag')].some(tag => normalizeTag(tag.textContent) === 'recently updated')) {
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
    return filterableCardTags(card).map(tag => tag.textContent.trim()).filter(Boolean);
  }

  const uniqueTags = [...new Map(
    cards.flatMap(card => cardTags(card)).map(label => [normalizeTag(label), label])
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
    <button class="clear-tag-filter" type="button" hidden>Clear tag filters</button>`;

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
      sortDirection.setAttribute('aria-label', direction === 'asc' ? 'Currently oldest to newest; change to newest to oldest' : 'Currently newest to oldest; change to oldest to newest');
    } else {
      sortDirection.textContent = direction === 'asc' ? 'A → Z' : 'Z → A';
      sortDirection.setAttribute('aria-label', direction === 'asc' ? 'Currently A to Z; change to Z to A' : 'Currently Z to A; change to A to Z');
    }
    sortDirection.dataset.direction = direction;
  }

  function sortCards() {
    const key = sortBy.value;
    const multiplier = direction === 'asc' ? 1 : -1;
    cards.sort((a, b) => {
      const primary = textCompare(sortValue(a, key), sortValue(b, key));
      if (primary !== 0) return primary * multiplier;
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
      const visible = (!q || haystack.includes(q)) && cardHasActiveTags(card);
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
  sortBy.addEventListener('change', () => { sortCards(); applyFilters(); });
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

  sortCards();
  applyFilters();
})();
