(() => {
  const pluralMap={
    tablespoon:'tablespoons',teaspoon:'teaspoons',ounce:'ounces',pound:'pounds',gram:'grams',milliliter:'milliliters'
  };
  const aliases={Tbsp:'tablespoon',tbsp:'tablespoon',tsp:'teaspoon',oz:'ounce',lb:'pound',g:'gram',mL:'milliliter'};

  function parseAmount(raw){
    const s=String(raw||'').trim();
    if(!s) return NaN;
    return s.split(/\s+/).reduce((total,part)=>{
      if(part.includes('/')){
        const [a,b]=part.split('/').map(Number);
        return b?total+a/b:NaN;
      }
      const n=Number(part);
      return Number.isNaN(n)?NaN:total+n;
    },0);
  }

  function unitLabel(abbr,n){
    const unit=aliases[abbr]||abbr;
    const plural=pluralMap[unit]||unit+'s';
    return Math.abs(n)<=1.00001?unit:plural;
  }

  function spell(text){
    let out=String(text)
      .replace(/(\d+(?:\.\d+)?)°F/g,'$1 degrees Fahrenheit')
      .replace(/(\d+(?:\.\d+)?)°C/g,'$1 degrees Celsius');

    out=out.replace(/(\d+(?:\s+\d+\/\d+|\/\d+)?)(\s*)(Tbsp|tbsp|tsp|mL|oz|lb|g)\b/g,(match,num,space,abbr)=>{
      const n=parseAmount(num);
      return `${num} ${unitLabel(abbr,n)}`;
    });
    return out;
  }

  function normalize(root=document.body){
    if(!root) return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode()){
      const node=walker.currentNode;
      const parent=node.parentElement;
      if(!parent||['SCRIPT','STYLE'].includes(parent.tagName)) continue;
      nodes.push(node);
    }
    nodes.forEach(node=>{
      const next=spell(node.nodeValue);
      if(next!==node.nodeValue) node.nodeValue=next;
    });
  }

  let scheduled=false;
  const schedule=()=>{
    if(scheduled) return;
    scheduled=true;
    queueMicrotask(()=>{scheduled=false;normalize();});
  };

  normalize();
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,characterData:true});
  window.FamilyRecipeUnits={spell,normalize};
})();
