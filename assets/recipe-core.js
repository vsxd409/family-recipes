(() => {
  const R = window.RECIPE;
  if(!R) return;
  const stateKey = 'familyRecipe:'+R.slug;
  let state = {factor:1, options:{}, ingredients:[], steps:[]};
  try{state={...state,...JSON.parse(localStorage.getItem(stateKey)||'{}')}}catch(e){}
  (R.options||[]).forEach(o=>{ if(state.options[o.key]===undefined) state.options[o.key]=!!o.default; });

  const pluralMap={cup:'cups',tablespoon:'tablespoons',teaspoon:'teaspoons',ounce:'ounces',pound:'pounds',egg:'eggs','large egg':'large eggs',clove:'cloves',onion:'onions',jalapeño:'jalapeños',chile:'chiles',packet:'packets',gram:'grams',milliliter:'milliliters',serving:'servings',apple:'apples',carrot:'carrots',potato:'potatoes',leaf:'leaves','green onion':'green onions','bell pepper':'bell peppers',lime:'limes'};
  function frac(x){
    if(x===null||x===undefined||Number.isNaN(x)) return '';
    if(Math.abs(x-Math.round(x))<0.015) return String(Math.round(x));
    const whole=Math.floor(x+1e-9), rem=x-whole;
    const dens=[2,3,4,6,8,12,16]; let best=null;
    for(const d of dens){ const n=Math.round(rem*d); if(!n||n===d) continue; const err=Math.abs(rem-n/d); if(!best||err<best.err) best={n,d,err}; }
    if(best && best.err<0.025){ const g=(a,b)=>b?g(b,a%b):a; const z=g(best.n,best.d); const part=(best.n/z)+'/'+(best.d/z); return (whole?whole+' ':'')+part; }
    return (Math.round(x*100)/100).toString();
  }
  function unitName(unit,n){ if(!unit) return ''; if(['g','mL','oz','lb'].includes(unit)) return unit; if(/\d/.test(unit)) return Math.abs(n-1)<0.015?unit:(unit.endsWith('can')?unit+'s':unit); const p=pluralMap[unit]||unit+'s'; return Math.abs(n-1)<0.015?unit:p; }
  function quantityText(ing,factor){
    if(ing.amountText) return ing.amountText;
    const q=ing.qty==null?null:ing.qty*factor;
    const q2=ing.qty2==null?null:ing.qty2*factor;
    let main='';
    if(q!==null){
      const useDecimal=['g','mL'].includes(ing.unit);
      const fmt=n=>useDecimal?(n>=10?String(Math.round(n)):String(Math.round(n*10)/10)):frac(n);
      main=q2!==null?`${fmt(q)}–${fmt(q2)} ${unitName(ing.unit,q2)}`:`${fmt(q)} ${unitName(ing.unit,q)}`;
    } else main=ing.unit||'';
    if(ing.metricQty!=null){ const mq=ing.metricQty*factor, mq2=ing.metricQty2==null?null:ing.metricQty2*factor; const fmt=n=>n>=10?Math.round(n):Math.round(n*10)/10; main += mq2!==null?` (${fmt(mq)}–${fmt(mq2)} ${ing.metricUnit})`:` (${fmt(mq)} ${ing.metricUnit})`; }
    if(ing.altQty!=null){ const aq=ing.altQty*factor; main += ` (about ${frac(aq)} ${unitName(ing.altUnit,aq)})`; }
    return main.trim();
  }
  function active(key){return !!state.options[key]}
  function effectiveQty(ing){
    let out={...ing};
    (R.adjustments||[]).forEach(a=>{
      if(a.target!==ing.id || !active(a.when)) return;
      if(out.qty!=null){
        if(a.set!=null) out.qty=a.set;
        if(a.delta!=null) out.qty+=a.delta;
        if(a.multiply!=null) out.qty*=a.multiply;
      }
      if(out.qty2!=null){
        if(a.set2!=null) out.qty2=a.set2;
        else if(a.set!=null) out.qty2=a.set;
        if(a.delta2!=null) out.qty2+=a.delta2;
        else if(a.delta!=null) out.qty2+=a.delta;
        if(a.multiply2!=null) out.qty2*=a.multiply2;
        else if(a.multiply!=null) out.qty2*=a.multiply;
      }
    });
    return out;
  }
  function conditionOK(x){ return (!x.when || active(x.when)) && (!x.unless || !active(x.unless)); }
  function included(ing){ return conditionOK(ing); }
  function save(){localStorage.setItem(stateKey,JSON.stringify(state))}
  function defaultOptions(){ const o={}; (R.options||[]).forEach(x=>o[x.key]=!!x.default); return o; }
  function applyOptionSet(keys, useDefaults=false){
    const next=useDefaults?defaultOptions():Object.fromEntries((R.options||[]).map(o=>[o.key,false]));
    (keys||[]).forEach(k=>next[k]=true);
    state.options=next; state.ingredients=[]; state.steps=[]; save(); render();
  }

  const title=document.getElementById('recipeTitle'); if(title) title.textContent=R.title;
  const pageHeading=document.querySelector('header h1');
  const baseHeading=pageHeading?.textContent||R.title;
  const originalDocumentTitle=document.title;
  const badge=document.getElementById('yieldBadge');
  const factorButtons=document.querySelectorAll('[data-factor]');
  factorButtons.forEach(b=>{ b.addEventListener('click',()=>{state.factor=Number(b.dataset.factor);state.ingredients=[];state.steps=[];save();render();}); });

  const presetHost=document.getElementById('presets');
  const presetSection=document.getElementById('presetSection');
  if(presetHost && presetSection){
    const presets=R.presets||[];
    if(!presets.length) presetSection.style.display='none';
    else {
      presetHost.innerHTML=`<button class="preset" data-preset="__base">Base</button>`+presets.map(p=>`<button class="preset" data-preset="${p.key}" title="${(p.description||'').replace(/"/g,'&quot;')}">${p.label}</button>`).join('');
      presetHost.querySelectorAll('[data-preset]').forEach(btn=>btn.addEventListener('click',()=>{
        if(btn.dataset.preset==='__base') applyOptionSet([],true);
        else { const p=presets.find(x=>x.key===btn.dataset.preset); applyOptionSet(p?.options||[],false); }
      }));
    }
  }

  const optHost=document.getElementById('options');
  if(optHost){
    if(!(R.options||[]).length){document.getElementById('optionSection').style.display='none'}
    else{
      optHost.innerHTML=(R.options||[]).map(o=>{
        const label=o.origin==='source'?'From source':o.origin==='family'?'Family note':o.origin==='source-inspired'?'Source-inspired':'Creative';
        const cls=o.origin==='source'||o.origin==='family'?'source':'creative';
        return `<label class="toggle"><input type="checkbox" data-option="${o.key}"><span><strong>${o.label} <em class="origin ${cls}">${label}</em></strong><span>${o.description||''}</span></span></label>`;
      }).join('');
      optHost.querySelectorAll('[data-option]').forEach(cb=>cb.addEventListener('change',e=>{state.options[e.target.dataset.option]=e.target.checked;state.ingredients=[];state.steps=[];save();render();}));
    }
  }

  function updatePresetState(){
    const presets=R.presets||[];
    if(!presets.length) return; // Recipes without named quick presets keep their original title.
    const activeKeys=(R.options||[]).filter(o=>active(o.key)).map(o=>o.key).sort();
    const eq=(a,b)=>a.length===b.length && a.every((v,i)=>v===b[i]);
    const baseKeys=(R.options||[]).filter(o=>o.default).map(o=>o.key).sort();
    const isBase=eq(activeKeys,baseKeys);
    // A preset name applies only when its complete option set is selected.
    // Individual creative add-ins, or combinations not matching a preset, retain the base title.
    const selected=isBase?null:presets.find(p=>eq(activeKeys,(p.options||[]).slice().sort()));
    document.querySelectorAll('[data-preset]').forEach(btn=>{
      btn.classList.toggle('active',selected?btn.dataset.preset===selected.key:btn.dataset.preset==='__base'&&isBase);
    });
    const displayTitle=selected?(selected.title||`${R.title} — ${selected.label}`):R.title;
    if(title) title.textContent=displayTitle;
    if(pageHeading) pageHeading.textContent=selected?displayTitle:baseHeading;
    document.title=selected?`${displayTitle} · Family Recipes`:originalDocumentTitle;
  }

  function render(){
    factorButtons.forEach(b=>b.classList.toggle('active',Number(b.dataset.factor)===Number(state.factor)));
    document.querySelectorAll('[data-option]').forEach(cb=>cb.checked=active(cb.dataset.option));
    updatePresetState();
    if(badge){ const y=R.yieldBase; badge.textContent=y?`${R.yieldLabel||'Yield'}: ${R.yieldFormat?R.yieldFormat(y*state.factor):frac(y*state.factor)+' '+(R.yieldUnit||'servings')}`:`${frac(state.factor)}× batch`; }
    const host=document.getElementById('ingredients'); host.innerHTML='';
    let currentGroup=null;
    (R.ingredients||[]).forEach(raw=>{
      if(!included(raw)) return;
      const ing=effectiveQty(raw);
      if(ing.qty!=null && ing.qty<=0 && (ing.qty2==null || ing.qty2<=0) && ing.hideWhenZero!==false) return;
      if(ing.group && ing.group!==currentGroup){currentGroup=ing.group; const gh=document.createElement('div'); gh.className='group-title'; gh.textContent=currentGroup; host.appendChild(gh);}
      const id=ing.id; const row=document.createElement('label'); row.className='ingredient'+(state.ingredients.includes(id)?' checked':'');
      row.innerHTML=`<input type="checkbox" data-ing="${id}" ${state.ingredients.includes(id)?'checked':''}><span><span class="iname">${ing.name}</span>${ing.note?`<span class="idesc">${ing.note}</span>`:''}</span><span class="amount">${quantityText(ing,state.factor)}</span>`;
      host.appendChild(row);
    });
    host.querySelectorAll('[data-ing]').forEach(cb=>cb.addEventListener('change',e=>{const id=e.target.dataset.ing;if(e.target.checked){if(!state.ingredients.includes(id))state.ingredients.push(id)}else state.ingredients=state.ingredients.filter(x=>x!==id);save();e.target.closest('.ingredient').classList.toggle('checked',e.target.checked);updateProgress();}));

    const steps=(R.steps||[]).filter(s=>typeof s==='string'||conditionOK(s));
    const sh=document.getElementById('steps'); sh.innerHTML='';
    steps.forEach((s,i)=>{const text=typeof s==='string'?s:s.text; const id='s'+i; const row=document.createElement('label');row.className='step'+(state.steps.includes(id)?' checked':'');row.innerHTML=`<input type="checkbox" data-step="${id}" ${state.steps.includes(id)?'checked':''}><span class="steptext"><span class="stepnum">${i+1}.</span> ${text}</span>`;sh.appendChild(row)});
    sh.querySelectorAll('[data-step]').forEach(cb=>cb.addEventListener('change',e=>{const id=e.target.dataset.step;if(e.target.checked){if(!state.steps.includes(id))state.steps.push(id)}else state.steps=state.steps.filter(x=>x!==id);save();e.target.closest('.step').classList.toggle('checked',e.target.checked);updateProgress();}));
    updateProgress();
  }
  function updateProgress(){
    const allIng=[...document.querySelectorAll('[data-ing]')], allSteps=[...document.querySelectorAll('[data-step]')]; const done=allIng.filter(x=>x.checked).length+allSteps.filter(x=>x.checked).length, total=allIng.length+allSteps.length; const pct=total?Math.round(done/total*100):0; const label=document.getElementById('progressText'), bar=document.getElementById('progressBar'); if(label)label.textContent=`${done} of ${total} checked`; if(bar)bar.style.width=pct+'%';
  }
  document.getElementById('resetAll')?.addEventListener('click',()=>{state.ingredients=[];state.steps=[];save();render()});
  render();
})();
