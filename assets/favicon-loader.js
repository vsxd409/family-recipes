(() => {
  const href = location.pathname.includes('/recipes/') ? '../favicon.svg' : 'favicon.svg';
  if (!document.head.querySelector('link[rel~="icon"]')) {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.href = href;
    document.head.appendChild(link);
  }
})();
