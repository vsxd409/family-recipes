(() => {
  const R = window.RECIPE;
  if (!R) return;

  const head=document.head;
  if(head && !head.querySelector('link[rel~="icon"]')){
    const svg=document.createElement('link'); svg.rel='icon'; svg.type='image/svg+xml'; svg.href='../favicon.svg'; head.appendChild(svg);
  }

  const scanMap = {
    'apple-butter-cinnamon-swirl-bread': 'Apple%20Butter%20Cinnamon%20Swirl%20Bread.pdf',
    'apple-slices': 'Apple%20Slices.pdf',
    'beef-stew': 'Beef%20Stew.pdf',
    'blueberry-muffins': 'Blueberry%20Muffins.pdf',
    'crockpot-chili': 'Crockpot%20Chili.pdf',
    'focaccia': 'Focaccia.pdf',
    'jiaozi': 'Jiaozi.pdf',
    'mayo': 'Mayo.pdf',
    'mochi-brownies': 'Mochi%20Brownies.pdf',
    'mug-scrambler': 'Mug%20Scrambler.jpg',
    'overnight-white-bread': 'Overnight%20White%20Bread%20-%20family%20notes.html',
    'pancakes': 'Pancakes.pdf',
    'pozole': 'Pozole.pdf',
    'steel-cut-oats': 'Steel%20cut%20oats.pdf',
    'swiss-meringue-buttercream': 'Swiss%20Meringue%20Buttercream.pdf'
  };

  const archivedScan = document.querySelector('span.scanlink');
  if (archivedScan && scanMap[R.slug]) {
    const link = document.createElement('a');
    link.className = 'scanlink';
    link.href = '../sources/' + scanMap[R.slug];
    link.target = '_blank';
    link.rel = 'noopener';
    if (R.slug === 'mug-scrambler') link.textContent = '▤ View source page';
    else if (R.slug === 'overnight-white-bread') link.textContent = '▤ View family notes';
    else link.textContent = '▤ View original scan';
    archivedScan.replaceWith(link);
  }

  const currentScriptUrl=document.currentScript.src;
  const units=document.createElement('script');
  units.src=new URL('units.js',currentScriptUrl).href;
  units.onload=()=>{
    const core=document.createElement('script');
    core.src=new URL('recipe-core.js',currentScriptUrl).href;
    document.head.appendChild(core);
  };
  document.head.appendChild(units);
})();
