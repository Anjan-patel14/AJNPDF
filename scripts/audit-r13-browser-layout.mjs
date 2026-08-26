import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = process.cwd();
const artifactDir = process.env.AJN_R13_ARTIFACT_DIR || path.join(os.homedir(), 'Downloads', `AJN-PDF-R13-BROWSER-${Date.now()}`);
fs.mkdirSync(artifactDir, { recursive: true });

function findBrowser() {
  const env = process.env;
  const candidates = process.platform === 'win32'
    ? [
        env.AJN_CHROME_PATH,
        env.AJN_EDGE_PATH,
        env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        env.PROGRAMFILES && path.join(env.PROGRAMFILES, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        env['PROGRAMFILES(X86)'] && path.join(env['PROGRAMFILES(X86)'], 'Google', 'Chrome', 'Application', 'chrome.exe'),
        env.PROGRAMFILES && path.join(env.PROGRAMFILES, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
        env['PROGRAMFILES(X86)'] && path.join(env['PROGRAMFILES(X86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe')]
    : [process.env.AJN_CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge'];
  return candidates.filter(Boolean).find((candidate) => fs.existsSync(candidate));
}

const browserPath = findBrowser();
if (!browserPath) {
  console.log('AJN PDF R13 BROWSER LAYOUT AUDIT: SKIP (Chrome/Edge executable not found).');
  process.exit(0);
}
if (!fs.existsSync(path.join(root, '.next', 'BUILD_ID'))) {
  console.error('FAIL: .next production build missing. Run npm run build first.');
  process.exit(1);
}

const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
if (!fs.existsSync(nextBin)) {
  console.error('FAIL: Next.js runtime missing from node_modules.');
  process.exit(1);
}

const appPort = 42600 + (process.pid % 300);
const debugPort = 45200 + (process.pid % 300);
const origin = `http://127.0.0.1:${appPort}`;
const browserProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'ajn-r13-browser-'));
const server = spawn(process.execPath, [nextBin, 'start', '-H', '127.0.0.1', '-p', String(appPort)], {
  cwd: root,
  env: { ...process.env, NODE_ENV: 'production' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let _serverLog = '';
server.stdout.on('data', (chunk) => { _serverLog += chunk.toString(); });
server.stderr.on('data', (chunk) => { _serverLog += chunk.toString(); });

const browser = spawn(browserPath, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-extensions',
  '--disable-background-networking', '--disable-sync', '--hide-scrollbars', '--mute-audio',
  `--remote-debugging-port=${debugPort}`, `--user-data-dir=${browserProfile}`, 'about:blank'], { stdio: 'ignore' });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitHttp(url, timeoutMs = 30000) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    try { const response = await fetch(url); if (response.ok) return response; } catch {}
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

class Cdp {
  constructor(url) {
    this.url = url; this.id = 0; this.pending = new Map(); this.listeners = new Map();
  }
  async open() {
    this.ws = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('CDP websocket timeout')), 10000);
      this.ws.onopen = () => { clearTimeout(timer); resolve(); };
      this.ws.onerror = (event) => { clearTimeout(timer); reject(new Error(`CDP websocket error ${event?.message || ''}`)); };
    });
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id) {
        const pending = this.pending.get(msg.id); if (!pending) return;
        this.pending.delete(msg.id);
        if (msg.error) pending.reject(new Error(msg.error.message)); else pending.resolve(msg.result);
      } else if (msg.method) {
        for (const listener of this.listeners.get(msg.method) || []) listener(msg.params || {});
      }
    };
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  on(method, fn) { if (!this.listeners.has(method)) this.listeners.set(method, []); this.listeners.get(method).push(fn); }
  close() { try { this.ws?.close(); } catch {} }
}

const cases = [
  { label: 'phone-320', physicalWidth: 320, physicalHeight: 568, zoom: 1 },
  { label: 'phone-360', physicalWidth: 360, physicalHeight: 800, zoom: 1 },
  { label: 'phone-375', physicalWidth: 375, physicalHeight: 667, zoom: 1 },
  { label: 'phone-390', physicalWidth: 390, physicalHeight: 844, zoom: 1 },
  { label: 'phone-412', physicalWidth: 412, physicalHeight: 915, zoom: 1 },
  { label: 'tablet-768', physicalWidth: 768, physicalHeight: 1024, zoom: 1 },
  { label: 'tablet-1024', physicalWidth: 1024, physicalHeight: 768, zoom: 1 },
  { label: 'desktop-1280', physicalWidth: 1280, physicalHeight: 720, zoom: 1 },
  { label: 'desktop-1366', physicalWidth: 1366, physicalHeight: 768, zoom: 1 },
  { label: 'desktop-1440', physicalWidth: 1440, physicalHeight: 900, zoom: 1 },
  { label: 'desktop-1536', physicalWidth: 1536, physicalHeight: 864, zoom: 1 },
  { label: 'desktop-1920', physicalWidth: 1920, physicalHeight: 1080, zoom: 1 },
  { label: 'desktop-1440-zoom110', physicalWidth: 1440, physicalHeight: 900, zoom: 1.10 },
  { label: 'desktop-1440-zoom125', physicalWidth: 1440, physicalHeight: 900, zoom: 1.25 },
  { label: 'desktop-1440-zoom150', physicalWidth: 1440, physicalHeight: 900, zoom: 1.50 },
  { label: 'desktop-1440-zoom200', physicalWidth: 1440, physicalHeight: 900, zoom: 2.00 },
  { label: 'tablet-768-zoom110', physicalWidth: 768, physicalHeight: 1024, zoom: 1.10 },
  { label: 'tablet-768-zoom125', physicalWidth: 768, physicalHeight: 1024, zoom: 1.25 },
  { label: 'tablet-768-zoom150', physicalWidth: 768, physicalHeight: 1024, zoom: 1.50 },
  { label: 'tablet-768-zoom200', physicalWidth: 768, physicalHeight: 1024, zoom: 2.00 }];
const pages = ['/', '/merge-pdf', '/pdf-tools', '/status'];
const allToolIds = JSON.parse(fs.readFileSync(path.join(root, 'scripts', 'r13-public-tool-ids.json'), 'utf8'));
const allToolRoutes = allToolIds.map((id) => `/${id}`);
const failures = [];
const results = [];

function safeName(value) { return value.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home'; }

function formatRuntimeException(params) {
  const details = params?.exceptionDetails || {};
  const exception = details.exception || {};
  const frames = details.stackTrace?.callFrames || [];
  const location = details.url ? `${details.url}:${Number(details.lineNumber || 0) + 1}:${Number(details.columnNumber || 0) + 1}` : '';
  const stack = frames.slice(0, 6).map((frame) => `${frame.functionName || '<anonymous>'}@${frame.url || details.url || 'unknown'}:${Number(frame.lineNumber || 0) + 1}:${Number(frame.columnNumber || 0) + 1}`).join(' <- ');
  return [details.text, exception.description, exception.className, location, stack].filter((value, index, items) => value && items.indexOf(value) === index).join(' | ') || 'runtime exception';
}

try {
  await waitHttp(`${origin}/`, 45000);
  await waitHttp(`http://127.0.0.1:${debugPort}/json/version`, 15000);
  const tabs = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
  const tab = tabs.find((item) => item.type === 'page');
  if (!tab?.webSocketDebuggerUrl) throw new Error('Chrome DevTools page target not available.');
  const cdp = new Cdp(tab.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Console.enable');
  const consoleErrors = [];
  cdp.on('Runtime.exceptionThrown', (params) => consoleErrors.push(formatRuntimeException(params)));
  cdp.on('Console.messageAdded', (params) => { if (params.message?.level === 'error') consoleErrors.push(params.message.text || 'console error'); });

  for (const testCase of cases) {
    const width = Math.max(240, Math.floor(testCase.physicalWidth / testCase.zoom));
    const height = Math.max(320, Math.floor(testCase.physicalHeight / testCase.zoom));
    await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600, screenWidth: width, screenHeight: height });

    for (const pathname of pages) {
      consoleErrors.length = 0;
      await cdp.send('Page.navigate', { url: `${origin}${pathname}` });
      for (let i = 0; i < 80; i += 1) {
        const state = await cdp.send('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true });
        if (state.result.value === 'complete') break;
        await sleep(100);
      }
      await sleep(300);
      const audit = await cdp.send('Runtime.evaluate', {
        returnByValue: true,
        expression: `(() => {
          const vw = window.innerWidth, vh = window.innerHeight;
          const doc = document.documentElement;
          const visible = (el) => { const s=getComputedStyle(el), r=el.getBoundingClientRect(); return s.display!=='none' && s.visibility!=='hidden' && r.width>0 && r.height>0; };
          const textControls = [...document.querySelectorAll('button,a,input,select,textarea')].filter(visible);
          const offscreen = textControls.filter(el => { const r=el.getBoundingClientRect(); return r.right > vw + 3 || r.left < -3; }).slice(0,12).map(el => ({tag:el.tagName,text:(el.textContent||el.getAttribute('aria-label')||'').trim().slice(0,80),left:Math.round(el.getBoundingClientRect().left),right:Math.round(el.getBoundingClientRect().right)}));
          const tiny = textControls.filter(el => { const r=el.getBoundingClientRect(); return (r.width < 28 || r.height < 28) && el.tagName !== 'A'; }).slice(0,12).map(el => ({tag:el.tagName,text:(el.textContent||el.getAttribute('aria-label')||'').trim().slice(0,80),w:Math.round(el.getBoundingClientRect().width),h:Math.round(el.getBoundingClientRect().height)}));
          const h1=document.querySelector('h1'); const hr=h1?.getBoundingClientRect();
          return {
            url: location.pathname, vw, vh,
            horizontalOverflow: doc.scrollWidth > vw + 2 || document.body.scrollWidth > vw + 2,
            scrollWidth: Math.max(doc.scrollWidth, document.body.scrollWidth),
            offscreen, tiny,
            h1: h1 ? {text:(h1.textContent||'').trim(), left:Math.round(hr.left), right:Math.round(hr.right), width:Math.round(hr.width), fontSize:getComputedStyle(h1).fontSize, lineHeight:getComputedStyle(h1).lineHeight} : null,
            release: document.querySelector('meta[name="ajn-release"]')?.getAttribute('content') || '',
            darkToggle: !![...document.querySelectorAll('button,a')].find(el => /dark mode|theme|moon/i.test((el.textContent||'')+' '+(el.getAttribute('aria-label')||''))),
          };
        })()`
      });
      const value = audit.result.value;
      const issues = [];
      if (value.horizontalOverflow) issues.push(`horizontal overflow ${value.scrollWidth}>${value.vw}`);
      if (value.offscreen.length) issues.push(`${value.offscreen.length} visible controls extend outside viewport`);
      if (pathname === '/' && value.release !== '3.1.0-r13') issues.push(`release marker=${value.release || 'missing'}`);
      if (value.darkToggle) issues.push('dark/theme control exposed');
      if (value.h1 && (value.h1.left < -2 || value.h1.right > value.vw + 2)) issues.push('H1 clips horizontally');
      if (consoleErrors.some((msg) => /hydration|chunk|uncaught|react error|418/i.test(msg))) issues.push(`runtime console errors: ${consoleErrors.filter((msg)=>/hydration|chunk|uncaught|react error|418/i.test(msg)).slice(0,4).join(' | ')}`);
      const row = { case: testCase.label, zoom: testCase.zoom, effectiveViewport: `${width}x${height}`, pathname, ...value, consoleErrors: [...consoleErrors], issues };
      results.push(row);
      for (const issue of issues) failures.push(`${testCase.label} ${pathname}: ${issue}`);

      if ((testCase.label === 'phone-375' || testCase.label === 'tablet-768' || testCase.label === 'desktop-1440' || testCase.label === 'desktop-1440-zoom110') && pathname === '/') {
        const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
        fs.writeFileSync(path.join(artifactDir, `${safeName(testCase.label)}-home.png`), Buffer.from(shot.data, 'base64'));
      }
    }
  }

  // Every canonical public tool route gets a real browser smoke at least once.
  // R16.0.14: wait for the actual interactive workspace instead of relying on
  // a fixed post-navigation delay. This keeps client-only native tools strict
  // while avoiding false failures during their dynamic chunk startup.
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
    screenWidth: 1440,
    screenHeight: 900,
  });

  for (const [routeIndex, pathname] of allToolRoutes.entries()) {
    console.log(`[desktop ${routeIndex + 1}/${allToolRoutes.length}] ${pathname}`);
    consoleErrors.length = 0;

    await cdp.send('Page.navigate', {
      url: `${origin}${pathname}`,
    });

    let routeReady = false;
    let lastReadiness = {
      complete: false,
      hasH1: false,
      hasWorkspace: false,
      path: '',
    };

    // Up to 12 seconds for a cold client-only workspace chunk.
    for (let attempt = 0; attempt < 120; attempt += 1) {
      const readiness = await cdp.send('Runtime.evaluate', {
        returnByValue: true,
        expression: `({
          complete: document.readyState === 'complete',
          hasH1: !!document.querySelector('h1'),
          hasWorkspace: !!document.querySelector('.jn-workspace'),
          path: location.pathname
        })`,
      });

      lastReadiness = readiness.result.value || lastReadiness;

      if (
        lastReadiness.complete &&
        lastReadiness.hasH1 &&
        lastReadiness.hasWorkspace &&
        lastReadiness.path === pathname
      ) {
        routeReady = true;
        break;
      }

      let _allRoutesReadiness = false;

      for (let readinessAttempt = 0; readinessAttempt < 120; readinessAttempt += 1) {
        const readiness = await cdp.send('Runtime.evaluate', {
          returnByValue: true,
          expression: `({
            complete: document.readyState === 'complete',
            heading: !!document.querySelector('h1')
          })`,
        });

        if (
          readiness.result.value?.complete &&
          readiness.result.value?.heading
        ) {
          _allRoutesReadiness = true;
          break;
        }

        await sleep(100);
      }

      // Give React passive effects/dynamic chunks a short settle window.
      await sleep(250);
    }

    // Let passive effects/layout settle without masking runtime exceptions.
    await sleep(250);

    const smoke = await cdp.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        const doc = document.documentElement;
        const bodyElement = document.body;
        const vw = innerWidth;
        const bodyText = (bodyElement?.innerText || '').slice(0, 5000);
        const h1 = document.querySelector('h1');
        const workspace = document.querySelector('.jn-workspace');

        return {
          path: location.pathname,
          title: document.title,
          readyState: document.readyState,
          hasH1: !!h1,
          h1Text: (h1?.textContent || '').trim().slice(0, 180),
          hasWorkspace: !!workspace,
          workspaceClass: workspace?.className || '',
          horizontalOverflow:
            doc.scrollWidth > vw + 2 ||
            (bodyElement?.scrollWidth || 0) > vw + 2,
          scrollWidth: Math.max(
            doc.scrollWidth,
            bodyElement?.scrollWidth || 0
          ),
          vw,
          notFound: /404|page not found/i.test(bodyText),
          bodyPreview: bodyText.slice(0, 400)
        };
      })()`,
    });

    const value = smoke.result.value || {};

    const catastrophic = consoleErrors.filter((msg) =>
      /hydration|chunk|uncaught|react error|418|typeerror|referenceerror/i.test(msg)
    );

    const issues = [];

    if (value.path !== pathname) {
      issues.push(`unexpected route ${value.path || '(missing)'}`);
    }

    if (!routeReady && !value.hasH1) {
      issues.push('missing H1/workspace heading after bounded readiness wait');
    }

    if (!routeReady && !value.hasWorkspace) {
      issues.push('interactive tool workspace did not mount after bounded readiness wait');
    }

    if (value.notFound) {
      issues.push('rendered not-found content');
    }

    if (value.horizontalOverflow) {
      issues.push(`horizontal overflow ${value.scrollWidth}>${value.vw}`);
    }

    if (catastrophic.length) {
      issues.push(
        `runtime console errors: ${catastrophic
          .slice(0, 4)
          .join(' | ')}`
      );
    }

    results.push({
      interaction: 'all-public-route-smoke',
      pathname,
      routeReady,
      readiness: lastReadiness,
      ...value,
      consoleErrors: [...consoleErrors],
      issues,
    });

    issues.forEach((issue) =>
      failures.push(`all-routes ${pathname}: ${issue}`)
    );

    if (issues.length === 0) {
      console.log(`  PASS ${pathname}`);
    } else {
      console.log(`  FAIL ${pathname}: ${issues.join(' | ')}`);
    }
  }
  // Optional extended mode adds representative phone/tablet smoke for all 107 routes.
  // Wait for the real production document and workspace heading instead of using a fixed delay.
  // This prevents route-to-route navigation from interrupting hydration while still failing on real runtime exceptions.
  if (process.env.AJN_BROWSER_FULL_ROUTE_AUDIT === '1') {
    for (const viewport of [{label:'all-phone-390',width:390,height:844,mobile:true},{label:'all-tablet-768',width:768,height:1024,mobile:false}]) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1,
        mobile: viewport.mobile,
        screenWidth: viewport.width,
        screenHeight: viewport.height,
      });

      for (const [routeIndex, pathname] of allToolRoutes.entries()) {
        console.log(`[${viewport.label} ${routeIndex + 1}/${allToolRoutes.length}] ${pathname}`);
        consoleErrors.length = 0;

        await cdp.send('Page.navigate', {
          url: `${origin}${pathname}`,
        });

        let pageReady = false;
        let headingReady = false;

        // A production page is not ready merely because Page.navigate returned.
        // Wait up to 12 seconds for both document completion and the actual workspace H1.
        for (let i = 0; i < 120; i += 1) {
          const readiness = await cdp.send('Runtime.evaluate', {
            returnByValue: true,
            expression: `({
              ready: document.readyState === 'complete',
              h1: !!document.querySelector('h1')
            })`,
          });

          pageReady = Boolean(readiness.result.value?.ready);
          headingReady = Boolean(readiness.result.value?.h1);

          if (pageReady && headingReady) break;

          await sleep(100);
        }

        // Allow passive effects and dynamic chunks to finish after the H1 exists.
        // Genuine hydration/runtime exceptions remain recorded and still fail the audit.
        await sleep(350);

        const layout = await cdp.send('Runtime.evaluate', {
          returnByValue: true,
          expression: `({
            vw: innerWidth,
            sw: Math.max(
              document.documentElement.scrollWidth,
              document.body.scrollWidth
            ),
            h1: !!document.querySelector('h1'),
            readyState: document.readyState
          })`,
        });

        const v = layout.result.value || {};

        const catastrophic = consoleErrors.filter((msg) =>
          /hydration|chunk|uncaught|react error|418|typeerror|referenceerror/i.test(msg)
        );

        if (!pageReady) {
          failures.push(
            `${viewport.label} ${pathname}: document did not reach complete state`
          );
        }

        if (!headingReady || !v.h1) {
          failures.push(
            `${viewport.label} ${pathname}: missing H1 after readiness wait`
          );
        }

        if (v.sw > v.vw + 2) {
          failures.push(
            `${viewport.label} ${pathname}: horizontal overflow ${v.sw}>${v.vw}`
          );
        }

        if (catastrophic.length) {
          failures.push(
            `${viewport.label} ${pathname}: runtime console errors: ${catastrophic
              .slice(0, 3)
              .join(' | ')}`
          );
        }

        if (
          pageReady &&
          headingReady &&
          v.h1 &&
          !(v.sw > v.vw + 2) &&
          catastrophic.length === 0
        ) {
          console.log(`  PASS ${viewport.label} ${pathname}`);
        } else {
          console.log(`  CHECK ${viewport.label} ${pathname}`);
        }

        results.push({
          interaction: 'full-route-responsive-smoke',
          case: viewport.label,
          pathname,
          pageReady,
          headingReady,
          ...v,
          consoleErrors: [...consoleErrors],
        });
      }
    }
  }
  // Interaction checks on a real desktop layout.
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false, screenWidth: 1440, screenHeight: 900 });
  await cdp.send('Page.navigate', { url: `${origin}/` });
  await sleep(800);
  const menuCheck = await cdp.send('Runtime.evaluate', { returnByValue: true, awaitPromise: true, expression: `(async()=>{
    const click=(sel)=>{const el=document.querySelector(sel); if(!el)return false; el.click(); return true;};
    const allClicked=click('[data-analytics-id="nav-all-tools"]'); await new Promise(r=>setTimeout(r,250));
    const dialog=document.querySelector('[role="dialog"][aria-modal="true"]');
    const dr=dialog?.getBoundingClientRect();
    const allOk=!!dialog && dr.left>=-2 && dr.right<=innerWidth+2 && dr.top>=-2 && dr.bottom<=innerHeight+2;
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    for(let i=0;i<24;i+=1){
      if(!document.querySelector('[role="dialog"][aria-modal="true"]')) break;
      await new Promise(r=>setTimeout(r,50));
    }
    const dialogStillOpen=!!document.querySelector('[role="dialog"][aria-modal="true"]');
    const converted=click('[data-analytics-id="nav-convert-menu"]'); await new Promise(r=>setTimeout(r,220));
    const menu=document.querySelector('[role="menu"][aria-label="Convert tools"]'); const mr=menu?.getBoundingClientRect();
    const convertOk=!!menu && mr.left>=-2 && mr.right<=innerWidth+2;
    return {allClicked,allOk,converted,convertOk,dialogStillOpen};
  })()` });
  if (!menuCheck.result.value?.allOk) failures.push('desktop All Tools dialog is missing or outside viewport');
  if (menuCheck.result.value?.dialogStillOpen) failures.push('Escape did not close All Tools dialog');
  if (!menuCheck.result.value?.convertOk) failures.push('desktop Convert menu is missing or outside viewport');
  results.push({ interaction: 'desktop menus', ...menuCheck.result.value });
  cdp.close();
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
} finally {
  try { browser.kill(); } catch {}
  try { server.kill(); } catch {}
  try { fs.rmSync(browserProfile, { recursive: true, force: true }); } catch {}
}

const report = { generatedAt: new Date().toISOString(), browserPath, artifactDir, cases: cases.length, pages, canonicalToolRoutes: allToolRoutes.length, fullRouteResponsiveAudit: process.env.AJN_BROWSER_FULL_ROUTE_AUDIT === '1', failures, results };
fs.writeFileSync(path.join(artifactDir, 'R13_BROWSER_LAYOUT_REPORT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  console.error(`AJN PDF R13 BROWSER LAYOUT AUDIT: FAIL (${failures.length} issue(s)). Report: ${artifactDir}`);
  process.exit(1);
}
console.log(`AJN PDF R13 BROWSER LAYOUT AUDIT: PASS (${results.length} checks).`);
console.log(`Screenshots/report: ${artifactDir}`);
