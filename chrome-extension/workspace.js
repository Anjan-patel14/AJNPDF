(() => {
  'use strict';
  const siteBase = 'https://www.ajnpdf.com';
  const api = globalThis.chrome && chrome.runtime && chrome.tabs ? chrome : null;
  const configs = {
    'image-to-pdf': { title:'Image to PDF', description:'Combine JPG, PNG, WEBP and other browser-supported images into one PDF directly in the extension.', multiple:true, action:'Create PDF' },
    'reduce-image': { title:'Reduce Image', description:'Create a smaller JPG or WEBP copy with a quality level you choose.', multiple:false, action:'Reduce image' },
    'resize-image': { title:'Resize Image', description:'Change image width while preserving its aspect ratio.', multiple:false, action:'Resize image' },
    'convert-image': { title:'Convert Image', description:'Convert a selected image to JPG, PNG or WEBP.', multiple:false, action:'Convert image' }
  };
  const toolOrder = Object.keys(configs);
  const MAX_FILE_BYTES = 50 * 1024 * 1024;
  const MAX_TOTAL_BYTES = 200 * 1024 * 1024;
  const MAX_IMAGE_PIXELS = 60_000_000;
  const params = new URLSearchParams(location.search);
  let toolId = configs[params.get('tool')] ? params.get('tool') : 'image-to-pdf';
  let selectedFiles = [];
  let resultUrl = '';
  let resultName = '';
  let resultBlob = null;

  const $ = (id) => document.getElementById(id);
  const fileInput=$('fileInput'), dropZone=$('dropZone'), selection=$('selection'), fileList=$('fileList'), options=$('options'), processButton=$('processButton'), processLabel=$('processLabel');
  const errorBox=$('errorBox'), workingBox=$('workingBox'), workingText=$('workingText'), resultCard=$('resultCard');
  const workspaceCard = document.querySelector('.workspace-card');
  const humanSize = (bytes) => bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes/1024).toFixed(1)} KB` : `${(bytes/1048576).toFixed(1)} MB`;
  const safeBase = (name) => (name.replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'') || 'ajn-file').slice(0,80);
  const openUrl = (url) => api ? chrome.tabs.create({url}) : window.open(url,'_blank','noopener,noreferrer');
  const showError = (message) => { errorBox.textContent=message; errorBox.hidden=false; workingBox.hidden=true; processButton.disabled=selectedFiles.length===0; };
  const clearError = () => { errorBox.hidden=true; errorBox.textContent=''; };
  const revokeResult = () => { if(resultUrl) URL.revokeObjectURL(resultUrl); resultUrl=''; resultBlob=null; resultName=''; resultCard.hidden=true; };

  function renderTool() {
    const config=configs[toolId];
    document.title=`${config.title} | AJN PDF Quick Tools`;
    $('toolTitle').textContent=config.title; $('toolDescription').textContent=config.description; processLabel.textContent=config.action;
    fileInput.multiple=config.multiple; fileInput.accept='image/*';
    $('dropTitle').textContent=config.multiple?'Choose images':'Choose an image';
    $('fileRule').textContent=config.multiple?'Up to 20 images • JPG, PNG, WEBP and browser-supported images':'JPG, PNG, WEBP and browser-supported images';
    selectedFiles=[]; fileInput.value=''; selection.hidden=true; dropZone.hidden=false; options.replaceChildren(); processButton.disabled=true; clearError(); revokeResult();
    renderOptions(); renderNativeGrid();
  }
  function renderOptions() {
    options.replaceChildren();
    const field=(label,control)=>{const wrap=document.createElement('div');wrap.className='option-field';const l=document.createElement('label');l.textContent=label;l.htmlFor=control.id;wrap.append(l,control);return wrap;};
    if(toolId==='reduce-image'){
      const wrap=document.createElement('div');wrap.className='option-field'; const label=document.createElement('label');label.textContent='Quality';
      const line=document.createElement('div');line.className='quality-line'; const range=document.createElement('input');range.type='range';range.id='quality';range.min='35';range.max='92';range.value='72'; const value=document.createElement('span');value.className='quality-value';value.textContent='72%';range.addEventListener('input',()=>value.textContent=`${range.value}%`); line.append(range,value);wrap.append(label,line);options.append(wrap);
      const format=document.createElement('select');format.id='format';[['image/jpeg','JPG'],['image/webp','WEBP']].forEach(([v,t])=>format.add(new Option(t,v)));options.append(field('Output format',format));
    } else if(toolId==='resize-image'){
      const width=document.createElement('input');width.id='width';width.type='number';width.min='64';width.max='8000';width.value='1200';width.inputMode='numeric';options.append(field('Width in pixels',width));
      const format=document.createElement('select');format.id='format';[['image/jpeg','JPG'],['image/png','PNG'],['image/webp','WEBP']].forEach(([v,t])=>format.add(new Option(t,v)));options.append(field('Output format',format));
    } else if(toolId==='convert-image'){
      const format=document.createElement('select');format.id='format';[['image/jpeg','JPG'],['image/png','PNG'],['image/webp','WEBP']].forEach(([v,t])=>format.add(new Option(t,v)));options.append(field('Output format',format));
      const quality=document.createElement('input');quality.id='quality';quality.type='number';quality.min='40';quality.max='100';quality.value='90';options.append(field('JPG / WEBP quality %',quality));
    }
  }
  function renderNativeGrid(){
    const grid=$('nativeToolGrid'); grid.replaceChildren(...toolOrder.filter(id=>id!==toolId).map(id=>{const cfg=configs[id];const b=document.createElement('button');b.type='button';b.className='native-tool';const strong=document.createElement('strong');strong.textContent=cfg.title;const small=document.createElement('small');small.textContent=cfg.description.split('.')[0]+'.';b.append(strong,small);b.addEventListener('click',()=>{history.replaceState(null,'',`?tool=${id}`);toolId=id;renderTool();window.scrollTo({top:0,behavior:'smooth'});});return b;}));
  }
  async function inspectImage(file){
    try{const bitmap=await createImageBitmap(file);const data={name:file.name,size:file.size,width:bitmap.width,height:bitmap.height};bitmap.close();return data;}catch{return {name:file.name,size:file.size,width:0,height:0};}
  }
  async function setFiles(fileListInput){
    clearError(); revokeResult();
    const incoming=[...fileListInput].filter(file=>file.type.startsWith('image/'));
    if(!incoming.length){showError('Choose a supported image file.');return;}
    if(configs[toolId].multiple && incoming.length>20){showError('Choose up to 20 images at a time.');return;}
    if(incoming.some(file=>file.size>MAX_FILE_BYTES)){showError('Each image must be 50 MB or smaller for this quick tool.');return;}
    const chosen=configs[toolId].multiple?incoming.slice(0,20):incoming.slice(0,1);
    if(chosen.reduce((total,file)=>total+file.size,0)>MAX_TOTAL_BYTES){showError('Choose images totaling 200 MB or less for one quick-tool job.');return;}
    selectedFiles=chosen;
    const inspected=await Promise.all(selectedFiles.map(inspectImage));
    if(inspected.some(info=>info.width&&info.height&&info.width*info.height>MAX_IMAGE_PIXELS)){selectedFiles=[];showError('One image is too large for the quick tool. Use the AJN PDF web image tool for very large images.');return;}
    $('selectionSummary').textContent=selectedFiles.length===1?selectedFiles[0].name:`${selectedFiles.length} images`;
    fileList.replaceChildren(...inspected.map(info=>{const row=document.createElement('div');row.className='file-row';const badge=document.createElement('span');badge.className='file-badge';badge.textContent='IMG';const copy=document.createElement('span');copy.className='file-copy';const strong=document.createElement('strong');strong.textContent=info.name;const small=document.createElement('small');small.textContent=`${humanSize(info.size)}${info.width?` • ${info.width}×${info.height}`:''}`;copy.append(strong,small);row.append(badge,copy);return row;}));
    dropZone.hidden=true; selection.hidden=false; processButton.disabled=false;
  }
  const loadBitmap=(file)=>createImageBitmap(file);
  async function bitmapToBlob(file,{width,format='image/jpeg',quality=.9}={}){
    const bitmap=await loadBitmap(file);const targetW=width?Math.max(1,Math.min(Number(width),8000)):bitmap.width;const scale=targetW/bitmap.width;const targetH=Math.max(1,Math.round(bitmap.height*scale));
    const canvas=document.createElement('canvas');canvas.width=targetW;canvas.height=targetH;const ctx=canvas.getContext('2d',{alpha:format==='image/png'});if(!ctx){bitmap.close();throw new Error('Canvas processing is unavailable.');}
    if(format==='image/jpeg'){ctx.fillStyle='#fff';ctx.fillRect(0,0,targetW,targetH);}ctx.drawImage(bitmap,0,0,targetW,targetH);bitmap.close();
    const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('Could not create the output image.')),format,quality));
    return {blob,width:targetW,height:targetH};
  }
  async function createImagePdf(){
    const pages=[];
    for(const file of selectedFiles){const converted=await bitmapToBlob(file,{format:'image/jpeg',quality:.92});pages.push({jpeg:new Uint8Array(await converted.blob.arrayBuffer()),width:converted.width,height:converted.height});}
    const bytes=window.AJNPdfBuilder.buildImagePdf(pages);return {blob:new Blob([bytes],{type:'application/pdf'}),name:`${safeBase(selectedFiles[0].name)}${selectedFiles.length>1?'-combined':''}.pdf`};
  }
  async function createImageOutput(){
    const file=selectedFiles[0];let format='image/jpeg',quality=.9,width;
    if(toolId==='reduce-image'){format=$('format').value;quality=Number($('quality').value)/100;}
    if(toolId==='resize-image'){format=$('format').value;width=Number($('width').value);if(!Number.isFinite(width)||width<64||width>8000)throw new Error('Enter a width between 64 and 8000 pixels.');}
    if(toolId==='convert-image'){format=$('format').value;quality=Number($('quality').value)/100;}
    const out=await bitmapToBlob(file,{format,quality,width});const ext=format==='image/png'?'png':format==='image/webp'?'webp':'jpg';return {blob:out.blob,name:`${safeBase(file.name)}-${toolId}.${ext}`};
  }
  async function process(){
    if(!selectedFiles.length)return;clearError();revokeResult();processButton.disabled=true;workspaceCard?.setAttribute('aria-busy','true');workingText.textContent=toolId==='image-to-pdf'?'Building your PDF…':'Processing your image…';workingBox.hidden=false;
    try{const out=toolId==='image-to-pdf'?await createImagePdf():await createImageOutput();resultBlob=out.blob;resultName=out.name;resultUrl=URL.createObjectURL(out.blob);$('resultTitle').textContent=out.name;$('resultMeta').textContent=`${humanSize(out.blob.size)} • Ready to download`;resultCard.hidden=false;resultCard.scrollIntoView({behavior:'smooth',block:'nearest'});}
    catch(error){showError(error instanceof Error?error.message:'This file could not be processed.');}
    finally{workspaceCard?.removeAttribute('aria-busy');workingBox.hidden=true;processButton.disabled=selectedFiles.length===0;}
  }

  dropZone.addEventListener('click',()=>fileInput.click());dropZone.addEventListener('keydown',(e)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fileInput.click();}});fileInput.addEventListener('change',()=>setFiles(fileInput.files));
  ['dragenter','dragover'].forEach(type=>dropZone.addEventListener(type,e=>{e.preventDefault();dropZone.classList.add('dragging');}));['dragleave','drop'].forEach(type=>dropZone.addEventListener(type,e=>{e.preventDefault();dropZone.classList.remove('dragging');}));dropZone.addEventListener('drop',e=>setFiles(e.dataTransfer.files));
  $('changeFiles').addEventListener('click',()=>fileInput.click());processButton.addEventListener('click',process);$('downloadButton').addEventListener('click',()=>{if(!resultUrl)return;const a=document.createElement('a');a.href=resultUrl;a.download=resultName;document.body.append(a);a.click();a.remove();});$('processAnother').addEventListener('click',renderTool);
  $('openWeb').addEventListener('click',()=>openUrl(`${siteBase}/pdf-tools?utm_source=chrome_extension&utm_medium=extension&utm_campaign=workspace`));$('privacy').addEventListener('click',()=>openUrl(`${siteBase}/chrome-extension/privacy`));$('switchTool').addEventListener('click',()=>document.querySelector('.other-tools')?.scrollIntoView({behavior:'smooth',block:'start'}));
  window.addEventListener('beforeunload',revokeResult);renderTool();
})();
