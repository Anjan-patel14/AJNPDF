(() => {
  'use strict';
  const siteBase = 'https://www.ajnpdf.com';
  const tools = Array.isArray(window.AJN_TOOLS) ? window.AJN_TOOLS : [];
  const api = globalThis.chrome && chrome.runtime && chrome.tabs ? chrome : null;
  const fallbackMessages = {
    quickTools:'Quick Tools', localActions:'Local quick actions', workSmarter:'Work smarter from Chrome', noPageAccess:'No page access',
    imageToPdf:'Image to PDF', imageToPdfSub:'Combine images into a PDF', reduceImage:'Reduce Image', reduceImageSub:'Make an image smaller',
    resizeImage:'Resize Image', resizeImageSub:'Change image dimensions', convertImage:'Convert Image', convertImageSub:'PNG, JPG or WEBP',
    allWorkflows:'AJN PDF workflows', toolsLabel:'tools', clear:'Clear', searchPlaceholder:'Search 100+ tools...', recent:'Recent', openAllTools:'Open all AJN PDF tools',
    localPrivacy:'Selected images are processed inside the extension.', privacy:'Privacy', noResults:'No matching tools found.'
  };
  const msg = (key) => (api && chrome.i18n && chrome.i18n.getMessage(key)) || fallbackMessages[key] || key;
  document.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = msg(node.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => { node.setAttribute('placeholder', msg(node.dataset.i18nPlaceholder)); });

  const search = document.getElementById('toolSearch');
  const results = document.getElementById('results');
  const filters = document.getElementById('filters');
  const recentWrap = document.getElementById('recentWrap');
  const recentList = document.getElementById('recentList');
  const clearRecent = document.getElementById('clearRecent');
  document.getElementById('toolCount').textContent = String(tools.length);
  const categoryOrder = ['All','PDF','Convert','Image','Edit','Security'];
  let activeCategory = 'All';
  let activeIndex = -1;

  const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const scoreTool = (tool, query) => {
    if (!query) return 1;
    const q = normalize(query);
    const name = normalize(tool.name);
    const haystack = normalize([tool.name, tool.desc, tool.id, ...(tool.aliases || [])].join(' '));
    if (name === q) return 100;
    if (name.startsWith(q)) return 80;
    if (haystack.includes(q)) return 60;
    const tokens = q.split(' ').filter(Boolean);
    const matched = tokens.filter((token) => haystack.includes(token)).length;
    return matched === tokens.length ? 40 + matched : matched * 8;
  };
  const openUrl = (url) => {
    if (api) chrome.tabs.create({ url });
    else window.open(url, '_blank', 'noopener,noreferrer');
  };
  const toolUrl = (id) => `${siteBase}/${encodeURIComponent(id)}?utm_source=chrome_extension&utm_medium=extension&utm_campaign=quick_tools`;
  const getRecent = () => {
    try { return JSON.parse(localStorage.getItem('ajn-ext-recent') || '[]').filter((id) => tools.some((t) => t.id === id)).slice(0,5); }
    catch { return []; }
  };
  const saveRecent = (id) => {
    const ids = [id, ...getRecent().filter((value) => value !== id)].slice(0,5);
    localStorage.setItem('ajn-ext-recent', JSON.stringify(ids));
    renderRecent();
  };
  const openTool = (tool) => { saveRecent(tool.id); openUrl(toolUrl(tool.id)); };

  function renderFilters() {
    filters.replaceChildren(...categoryOrder.map((category) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'filter-button'; button.textContent = category;
      button.setAttribute('aria-pressed', String(category === activeCategory));
      button.addEventListener('click', () => { activeCategory = category; activeIndex = -1; renderFilters(); renderResults(); });
      return button;
    }));
  }
  function renderRecent() {
    const ids = getRecent();
    recentWrap.hidden = ids.length === 0;
    clearRecent.hidden = ids.length === 0;
    recentList.replaceChildren(...ids.map((id) => {
      const tool = tools.find((item) => item.id === id);
      const button = document.createElement('button'); button.type='button'; button.className='recent-pill'; button.textContent=tool.name;
      button.addEventListener('click', () => openTool(tool)); return button;
    }));
  }
  function currentResults() {
    const query = search.value;
    return tools.map((tool,index)=>({tool,index,score:scoreTool(tool,query)}))
      .filter(({tool,score}) => (activeCategory === 'All' || tool.category === activeCategory) && score > 0)
      .sort((a,b)=> query ? (b.score-a.score || a.index-b.index) : a.index-b.index)
      .slice(0, query ? 12 : 8).map((item)=>item.tool);
  }
  function renderResults() {
    const list = currentResults();
    if (activeIndex >= list.length) activeIndex = list.length - 1;
    if (!list.length) { const empty=document.createElement('div'); empty.className='empty'; empty.textContent=msg('noResults'); results.replaceChildren(empty); return; }
    results.replaceChildren(...list.map((tool,index)=>{
      const button=document.createElement('button'); button.type='button'; button.className='result-row'; button.setAttribute('role','option'); button.setAttribute('aria-selected',String(index===activeIndex));
      const icon=document.createElement('span'); icon.className='result-icon'; icon.textContent=tool.category==='Security'?'SEC':tool.category==='Image'?'IMG':tool.category==='Convert'?'CVT':'PDF';
      const copy=document.createElement('span'); copy.className='result-copy'; const strong=document.createElement('strong'); strong.textContent=tool.name; const small=document.createElement('small'); small.textContent=tool.desc; copy.append(strong,small);
      const arrow=document.createElement('span'); arrow.className='result-arrow'; arrow.textContent='›';
      button.append(icon,copy,arrow); button.addEventListener('click',()=>openTool(tool)); return button;
    }));
  }

  search.addEventListener('input',()=>{activeIndex=-1;renderResults();});
  search.addEventListener('keydown',(event)=>{
    const list=currentResults(); if(!list.length) return;
    if(event.key==='ArrowDown'){event.preventDefault();activeIndex=Math.min(activeIndex+1,list.length-1);renderResults();}
    else if(event.key==='ArrowUp'){event.preventDefault();activeIndex=Math.max(activeIndex-1,0);renderResults();}
    else if(event.key==='Enter'){event.preventDefault();openTool(list[Math.max(activeIndex,0)]);}
  });
  document.querySelectorAll('[data-native-tool]').forEach((button)=>button.addEventListener('click',()=>{
    const path = `workspace.html?tool=${encodeURIComponent(button.dataset.nativeTool)}`;
    openUrl(api ? chrome.runtime.getURL(path) : path);
  }));
  clearRecent.addEventListener('click',()=>{localStorage.removeItem('ajn-ext-recent');renderRecent();});
  document.getElementById('openAll').addEventListener('click',()=>openUrl(`${siteBase}/pdf-tools?utm_source=chrome_extension&utm_medium=extension&utm_campaign=quick_tools`));
  document.getElementById('openSite').addEventListener('click',()=>openUrl(`${siteBase}/?utm_source=chrome_extension&utm_medium=extension&utm_campaign=quick_tools`));
  document.getElementById('privacyLink').addEventListener('click',()=>openUrl(`${siteBase}/chrome-extension/privacy`));
  renderFilters(); renderRecent(); renderResults();
})();
