const fs = require('fs');
const path = require('path');

const prdPath = '/Users/jiangjiahao/Documents/Workspace/PRD-Reader/docs/prd/2604_2/F2_仓库切换/PRD_仓库切换_2604_2.md';
const outPath = '/Users/jiangjiahao/Documents/Workspace/PRD-Reader/docs/prd/2604_2/F2_仓库切换/Interactive_PRD.html';

const prdContent = fs.readFileSync(prdPath, 'utf8');

// Basic markdown to HTML (simple regex-based since we can't easily npm install marked here, or wait, I can use marked from CDN in the browser)
// Actually, doing it in the browser with marked.js is easier. Let's build the HTML shell and let JS do the conversion.
// Or better yet, we can just write an HTML file that includes marked.js and the PRD content as a string or script tag, then parses it on load.
// Yes, a self-contained HTML that has the markdown embedded in a <template> or <script type="text/markdown">.

const htmlTemplate = `<!DOCTYPE html>
<html lang="zh-CN" class="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive PRD - 仓库切换与独立列表页</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        brand: {
                            50: '#eff6ff',
                            100: '#dbeafe',
                            500: '#3b82f6',
                            600: '#2563eb',
                            900: '#1e3a8a',
                        }
                    }
                }
            }
        }
    </script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
    <script>
        // Ensure iframe scrollbar is hidden globally
        window.hideIframeScrollbar = function(iframe) {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                const style = doc.createElement('style');
                style.textContent = \`
                    ::-webkit-scrollbar { display: none !important; width: 0 !important; background: transparent !important; }
                    * { -ms-overflow-style: none !important; scrollbar-width: none !important; }
                \`;
                doc.head.appendChild(style);
            } catch(e) {}
        };
    </script>
    <style>
        /* Mermaid Defense Patterns */
        div[id^="dmermaid"] { 
            position: absolute !important; 
            top: -9999px !important; 
            visibility: hidden !important; 
        }
        
        /* Layout */
        body { margin: 0; overflow: hidden; background-color: #f8fafc; }
        .dark body { background-color: #0f172a; color: #f1f5f9; }
        
        #app { display: flex; height: 100vh; width: 100vw; }
        
        /* TOC */
        #toc-panel {
            width: 260px;
            background: #ffffff;
            border-right: 1px solid #e2e8f0;
            overflow-y: auto;
            transition: all 0.3s ease;
            flex-shrink: 0;
            padding: 20px 0;
        }
        .dark #toc-panel { background: #1e293b; border-color: #334155; }
        #toc-panel.collapsed { width: 0; padding: 0; border: none; overflow: hidden; }
        
        .toc-item {
            padding: 8px 20px;
            cursor: pointer;
            color: #64748b;
            font-size: 14px;
            transition: all 0.2s;
            border-left: 3px solid transparent;
        }
        .dark .toc-item { color: #94a3b8; }
        .toc-item:hover { background: #f1f5f9; color: #0f172a; }
        .dark .toc-item:hover { background: #334155; color: #f8fafc; }
        .toc-item.active {
            color: #2563eb;
            background: #eff6ff;
            border-left-color: #2563eb;
            font-weight: 600;
        }
        .dark .toc-item.active {
            color: #60a5fa;
            background: #1e3a8a;
            border-left-color: #60a5fa;
        }
        .toc-h2 { padding-left: 20px; }
        .toc-h3 { padding-left: 35px; font-size: 13px; }
        .toc-h4 { padding-left: 50px; font-size: 12px; }

        /* Content */
        #main-scroll {
            flex: 1;
            overflow-y: auto;
            padding: 40px;
            scroll-behavior: smooth;
        }
        
        .markdown-body {
            max-width: 800px;
            margin: 0 auto;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
        }
        
        .markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4 {
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            font-weight: 600;
        }
        .markdown-body h1 { font-size: 2em; padding-bottom: 0.3em; border-bottom: 1px solid #e2e8f0; }
        .dark .markdown-body h1 { border-color: #334155; }
        .markdown-body h2 { font-size: 1.5em; padding-bottom: 0.3em; border-bottom: 1px solid #e2e8f0; }
        .dark .markdown-body h2 { border-color: #334155; }
        .markdown-body h3 { font-size: 1.25em; }
        
        .markdown-body p { margin-top: 0; margin-bottom: 16px; }
        .markdown-body ul, .markdown-body ol { padding-left: 2em; margin-bottom: 16px; }
        .markdown-body table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        .markdown-body th, .markdown-body td { border: 1px solid #e2e8f0; padding: 8px 12px; }
        .dark .markdown-body th, .dark .markdown-body td { border-color: #334155; }
        .markdown-body th { background: #f8fafc; }
        .dark .markdown-body th { background: #1e293b; }
        
        .markdown-body code { background: #f1f5f9; padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 0.9em; color: #db2777; }
        .dark .markdown-body code { background: #334155; color: #f472b6; }
        .markdown-body pre { background: #1e293b; padding: 16px; border-radius: 8px; overflow-x: auto; color: #f8fafc; }
        .markdown-body pre code { background: transparent; padding: 0; color: inherit; }

        /* Prototype Panel */
        #prototype-panel {
            width: 800px;
            background: #e2e8f0;
            border-left: 1px solid #cbd5e1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
            flex-shrink: 0;
            min-width: 0; /* 防撑破 */
            overflow: hidden;
        }
        .dark #prototype-panel { background: #0f172a; border-color: #334155; }
        
        /* Iframe Scaling */
        .iframe-container {
            width: 800px;
            height: 100%;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        #prototype-iframe {
            width: 1440px;
            height: calc(100% * (1440 / 800));
            transform: scale(calc(800 / 1440));
            transform-origin: top left;
            position: absolute;
            top: 0;
            left: 0;
            border: none;
            background: #fff;
            transition: opacity 0.15s ease;
        }

        /* Floating Controls */
        .controls {
            position: fixed;
            top: 20px;
            left: 20px;
            display: flex;
            gap: 10px;
            z-index: 50;
        }
        .control-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: white;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: #475569;
            transition: all 0.2s;
        }
        .dark .control-btn {
            background: #1e293b;
            border-color: #334155;
            color: #94a3b8;
        }
        .control-btn:hover { transform: scale(1.05); }
    </style>
</head>
<body>

    <div class="controls">
        <button class="control-btn" id="btn-toggle-toc" title="Toggle TOC">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        <button class="control-btn" id="btn-toggle-theme" title="Toggle Dark Mode">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
        </button>
    </div>

    <div id="app">
        <!-- TOC -->
        <div id="toc-panel">
            <div style="padding: 0 20px 10px 20px; font-weight: bold; font-size: 18px; margin-top: 40px;">目录</div>
            <div id="toc-content"></div>
        </div>
        
        <!-- Main Content -->
        <div id="main-scroll">
            <div class="markdown-body" id="md-content"></div>
            <!-- Bottom padding for scrolling -->
            <div style="padding-bottom: 100vh;"></div>
        </div>
        
        <!-- Prototype -->
        <div id="prototype-panel">
            <div class="iframe-container">
                <iframe id="prototype-iframe" src="./Prototypes/home.html" onload="hideIframeScrollbar(this)"></iframe>
            </div>
        </div>
    </div>

    <!-- The Markdown Content -->
    <script type="text/markdown" id="raw-markdown">
${prdContent.replace(/`/g, '\\`').replace(/\$/g, '\\$')}
    </script>

    <script>
        // 1. Initialize
        document.getElementById('btn-toggle-toc').addEventListener('click', () => {
            document.getElementById('toc-panel').classList.toggle('collapsed');
        });
        
        document.getElementById('btn-toggle-theme').addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
        });

        // 2. Parse Markdown
        const rawMd = document.getElementById('raw-markdown').textContent;
        
        // Extract Mermaid blocks before marked parsing to prevent mangling
        const mermaidBlocks = [];
        let mdForParsing = rawMd.replace(/\\x60\\x60\\x60mermaid\\n([\\s\\S]*?)\\x60\\x60\\x60/g, (match, code) => {
            const id = 'mermaid-' + mermaidBlocks.length;
            mermaidBlocks.push({ id, code });
            return \`<div id="\${id}" class="mermaid-placeholder"></div>\`;
        });

        document.getElementById('md-content').innerHTML = marked.parse(mdForParsing);

        // 3. Build TOC & Add IDs
        const headings = document.getElementById('md-content').querySelectorAll('h2, h3, h4');
        const tocContent = document.getElementById('toc-content');
        
        headings.forEach((heading, index) => {
            const id = 'sec-' + index;
            heading.id = id;
            
            const level = heading.tagName.toLowerCase();
            const div = document.createElement('div');
            div.className = \`toc-item toc-\${level}\`;
            div.textContent = heading.textContent;
            div.setAttribute('data-target', id);
            
            // Map section to prototype file
            let prototypeFile = '';
            let hash = '';
            const text = heading.textContent;
            
            if (text.includes('6.1')) {
                prototypeFile = 'home.html';
            } else if (text.includes('6.2') || text.includes('6.4')) {
                prototypeFile = 'index.html';
            } else if (text.includes('6.3')) {
                prototypeFile = 'index.html';
                hash = '#repoDropdown';
            }
            
            if (prototypeFile) {
                div.setAttribute('data-prototype', prototypeFile);
                if (hash) div.setAttribute('data-hash', hash);
            }
            
            div.addEventListener('click', () => {
                heading.scrollIntoView({ behavior: 'smooth' });
            });
            
            tocContent.appendChild(div);
        });

        // 4. Render Mermaid (Strict Serial with Defense)
        mermaid.initialize({ startOnLoad: false, htmlLabels: true });
        
        async function renderMermaid() {
            for (let i = 0; i < mermaidBlocks.length; i++) {
                const { id, code } = mermaidBlocks[i];
                try {
                    // Entity Decode & Patch
                    let cleanCode = code
                        .replace(/&gt;/g, '>')
                        .replace(/&lt;/g, '<')
                        .replace(/&amp;/g, '&')
                        .replace(/&quot;/g, '"')
                        .replace(/&#39;/g, "'")
                        .replace(/\\u200B/g, '')
                        .split('||--o{').join(' ||--o{ '); // Patch ER diagrams
                        
                    const { svg } = await mermaid.render('d' + id, cleanCode);
                    document.getElementById(id).innerHTML = svg;
                    
                    // Clean ghost node
                    const ghost = document.getElementById('d' + id);
                    if (ghost) ghost.remove();
                } catch (e) {
                    console.error('Mermaid render error:', e);
                    document.getElementById(id).innerHTML = \`<div style="background:#fee2e2; color:#b91c1c; padding:10px; border-radius:4px;">Mermaid Error: \${e.message}</div>\`;
                    const ghost = document.getElementById('d' + id);
                    if (ghost) ghost.remove();
                }
            }
        }
        renderMermaid();

        // 5. Scroll Spy & Iframe Sync
        const mainScroll = document.getElementById('main-scroll');
        const sections = Array.from(headings);
        const navItems = document.querySelectorAll('.toc-item');
        let scrollDebounceTimer;

        mainScroll.addEventListener('scroll', () => {
            let current = '';
            const mainRect = mainScroll.getBoundingClientRect();
            
            for (let i = sections.length - 1; i >= 0; i--) {
                const section = sections[i];
                const rect = section.getBoundingClientRect();
                
                if (rect.top <= mainRect.top + 150) {
                    current = section.getAttribute('id');
                    break;
                }
            }
            
            if (!current && sections.length > 0) {
                current = sections[0].getAttribute('id');
            }
            
            navItems.forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-target') === current) {
                    item.classList.add('active');
                    
                    // Iframe sync
                    clearTimeout(scrollDebounceTimer);
                    scrollDebounceTimer = setTimeout(() => {
                        const prototypeFile = item.getAttribute('data-prototype');
                        const hash = item.getAttribute('data-hash') || '';
                        const iframe = document.getElementById('prototype-iframe');
                        
                        if (prototypeFile && iframe) {
                            const baseUrl = window.location.href;
                            const currentUrl = new URL(iframe.src, baseUrl);
                            const newSrcRaw = \`./Prototypes/\${prototypeFile}\${hash}\`;
                            const newUrl = new URL(newSrcRaw, baseUrl);
                            
                            const isSamePath = currentUrl.pathname === newUrl.pathname;
                            if (isSamePath && currentUrl.hash === newUrl.hash) return;
                            
                            if (window.iframeUpdateTimeout) clearTimeout(window.iframeUpdateTimeout);
                            
                            window.iframeUpdateTimeout = setTimeout(() => {
                                iframe.style.opacity = '0';
                                
                                setTimeout(() => {
                                    iframe.src = newUrl.pathname + newUrl.search;
                                    iframe.onload = null;
                                    
                                    iframe.onload = () => {
                                        iframe.style.opacity = '1';
                                        hideIframeScrollbar(iframe);
                                        
                                        try {
                                            const iframeWin = iframe.contentWindow;
                                            iframeWin.location.hash = newUrl.hash;
                                        } catch(e) {}
                                    };
                                }, 150);
                            }, 150);
                        }
                    }, 300);
                }
            });
        });
        
        // Initial trigger
        setTimeout(() => mainScroll.dispatchEvent(new Event('scroll')), 500);
    </script>
</body>
</html>`;

fs.writeFileSync(outPath, htmlTemplate, 'utf8');
console.log('Interactive PRD generated successfully at: ' + outPath);
