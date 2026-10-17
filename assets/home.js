(() => {
 const search=document.getElementById('search'); const filters=[...document.querySelectorAll('[data-filter]')]; const cards=[...document.querySelectorAll('.recipe-card')]; const empty=document.getElementById('empty'); let cat='all';
 function apply(){const q=(search.value||'').trim().toLowerCase();let shown=0;cards.forEach(c=>{const okCat=cat==='all'||c.dataset.category===cat;const okQ=!q||c.dataset.search.includes(q);const on=okCat&&okQ;c.style.display=on?'grid':'none';if(on)shown++;});empty.style.display=shown?'none':'block'}
 filters.forEach(b=>b.addEventListener('click',()=>{cat=b.dataset.filter;filters.forEach(x=>x.classList.toggle('active',x===b));apply()})); search.addEventListener('input',apply);
})();
