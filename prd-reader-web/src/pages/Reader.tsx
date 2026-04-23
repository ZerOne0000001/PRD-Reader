import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Pin, ArrowLeft, ArrowRightToLine, ChevronDown, ChevronRight, Cloud, Folder, FileText, Monitor, Copy, Settings, Lock, Key, X, List, Search, Image as ImageIcon, Link, Check, LayoutGrid, Home as HomeIcon, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { useReaderStore, RepoTree, GitlabNode } from '@/store/readerStore'
import { useConfigStore } from '@/store/configStore'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { createPortal } from 'react-dom'
import mermaid from 'mermaid'
import Home from './Home'

mermaid.initialize({ startOnLoad: false, theme: 'default' })

// --- Global Smart Tooltip ---
type TooltipState = {
  visible: boolean;
  text: string;
  x: number;
  y: number;
}

let globalTooltipTimer: NodeJS.Timeout | null = null;
let setGlobalTooltipState: React.Dispatch<React.SetStateAction<TooltipState>> | null = null;

const SmartTooltipContainer = () => {
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, text: '', x: 0, y: 0 });
  
  useEffect(() => {
    setGlobalTooltipState = setTooltip;
    return () => { setGlobalTooltipState = null; }
  }, []);

  if (!tooltip.visible) return null;

  return createPortal(
    <div 
      className="fixed z-[9999] pointer-events-none bg-white rounded-2xl border border-gray-100 px-4 py-2"
      style={{ 
        left: tooltip.x, 
        top: tooltip.y,
        maxWidth: '320px',
        boxShadow: '0 10px 25px -5px rgba(162, 210, 255, 0.3)',
        animation: 'tooltip-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
      }}
    >
      <div className="text-[13px] font-semibold text-[#4A4E69] leading-relaxed break-words whitespace-normal">{tooltip.text}</div>
    </div>,
    document.body
  );
}

const handleNodeMouseEnter = (e: React.MouseEvent<HTMLDivElement>, text: string) => {
  if (document.body.classList.contains('dragging-sidebar')) return;
  
  const target = e.currentTarget;
  const labelSpan = target.querySelector('.node-label') as HTMLElement;
  if (!labelSpan) return;

  if (labelSpan.scrollWidth > labelSpan.clientWidth) {
    if (globalTooltipTimer) clearTimeout(globalTooltipTimer);
    globalTooltipTimer = setTimeout(() => {
      const rect = target.getBoundingClientRect();
      setGlobalTooltipState?.({
        visible: true,
        text,
        x: rect.left + 24,
        y: rect.bottom + 6
      });
    }, 300);
  }
}

const handleNodeMouseLeave = () => {
  if (globalTooltipTimer) clearTimeout(globalTooltipTimer);
  setGlobalTooltipState?.(prev => ({ ...prev, visible: false }));
}
// ----------------------------

const copyToClipboard = async (text: string): Promise<boolean> => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  }
  // Fallback
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
    return false;
  }
}

// --- Image Viewer Modal ---
const ImageViewer = ({ src, alt, onClose }: { src: string, alt?: string, onClose: () => void }) => {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    // 阻止页面滚动
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(s => Math.max(0.1, Math.min(s * zoomFactor, 10)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartPos({ x: e.clientX - pos.x, y: e.clientY - pos.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPos({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm select-none"
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <button 
        onClick={onClose} 
        className="absolute top-6 right-6 text-white p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
      >
         <X className="w-6 h-6" />
      </button>
      
      <div className="absolute bottom-8 flex items-center gap-6 bg-[#2B2D42]/90 text-white px-6 py-3 rounded-full shadow-2xl backdrop-blur-md z-10 border border-white/10">
         <button onClick={() => setScale(s => Math.max(0.1, s * 0.8))} className="hover:text-[var(--accent-blue)] transition-colors p-1" title="缩小">
           <ZoomOut className="w-5 h-5" />
         </button>
         <span className="w-16 text-center font-mono font-bold text-sm select-none">{Math.round(scale * 100)}%</span>
         <button onClick={() => setScale(s => Math.min(10, s * 1.2))} className="hover:text-[var(--accent-blue)] transition-colors p-1" title="放大">
           <ZoomIn className="w-5 h-5" />
         </button>
         <div className="w-px h-5 bg-white/20 mx-1"></div>
         <button onClick={() => { setScale(1); setPos({x:0, y:0}); }} className="hover:text-[var(--accent-blue)] transition-colors p-1 flex items-center gap-2 text-sm font-bold" title="还原">
           <RotateCcw className="w-4 h-4" />
           还原
         </button>
      </div>

      <div 
        className="w-full h-full flex items-center justify-center overflow-hidden"
        onMouseDown={handleMouseDown}
      >
        <img 
          src={src} 
          alt={alt || 'Preview'} 
          className={`max-w-[90vw] max-h-[90vh] object-contain transition-transform duration-[50ms] ease-linear ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})` }}
          draggable={false}
        />
      </div>
    </div>,
    document.body
  );
}
// ----------------------------

const TreeNode = ({ node, repo, onFileClick, onShareClick, depth = 0, onDrillDown }: { node: GitlabNode, repo: RepoTree, onFileClick: (repoId: string, filePath: string) => void, onShareClick: (e: React.MouseEvent, repo: RepoTree, node: GitlabNode, gitUrl: string) => void, depth?: number, onDrillDown: (node: GitlabNode) => void }) => {
  const [expanded, setExpanded] = useState(false)
  const isTree = node.type === 'tree'
  const { config } = useConfigStore()
  const currentPlatform = config?.platform || 'gitlab'
  const platformConfig = currentPlatform === 'github' ? config?.github : config?.gitlab
  const baseUrl = platformConfig?.instanceUrl ? platformConfig.instanceUrl.replace(/\/$/, '') : (currentPlatform === 'github' ? 'https://github.com' : 'https://gitlab.com')

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    const gitLabPath = currentPlatform === 'github' ? 'tree' : '-/tree'
    const gitUrl = isTree 
      ? `${baseUrl}/${repo.path}/${gitLabPath}/${repo.default_branch}/${node.path}`
      : `${baseUrl}/${repo.path}/${currentPlatform === 'github' ? 'blob' : '-/blob'}/${repo.default_branch}/${node.path}`
    onShareClick(e, repo, node, gitUrl)
  }

  const handleDrillDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDrillDown(node)
  }

  if (isTree) {
    return (
      <div className="mt-1" style={{ paddingLeft: depth === 0 ? '0' : '16px' }}>
        <div 
          className="flex items-center justify-between group px-2 py-2 hover:bg-white/50 rounded-xl transition-colors cursor-pointer"
          onClick={() => setExpanded(!expanded)}
          onMouseEnter={(e) => handleNodeMouseEnter(e, node.name)}
          onMouseLeave={handleNodeMouseLeave}
        >
          <div className="flex items-center gap-2 text-[#6B7280] font-semibold flex-1 min-w-0">
            {expanded ? <ChevronDown className="w-4 h-4 shrink-0 text-[#9CA3AF]" /> : <ChevronRight className="w-4 h-4 shrink-0 text-[#9CA3AF]" />}
            <Folder className="w-4 h-4 shrink-0 text-[var(--accent-yellow)]" />
            <span className="flex-1 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis node-label">{node.name}</span>
          </div>
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all shrink-0 ml-2">
            <button className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[var(--accent-blue)] hover:bg-white" onClick={handleShare} title="分享链接">
              <Copy className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[var(--accent-blue)] hover:bg-white" onClick={handleDrillDown} title="进入此目录">
              <ArrowRightToLine className="w-4 h-4" />
            </button>
          </div>
        </div>
        {expanded && node.children && (
          <div>
            {node.children.map(child => <TreeNode key={child.id} node={child} repo={repo} onFileClick={onFileClick} onShareClick={onShareClick} depth={depth + 1} onDrillDown={onDrillDown} />)}
          </div>
        )}
      </div>
    )
  }

  // Blob node
  const isMd = /\.md$/i.test(node.name)
  const isHtml = /\.html$/i.test(node.name)
  const isImage = /\.(png|jpe?g|gif|svg|webp)$/i.test(node.name)

  return (
    <div style={{ paddingLeft: depth === 0 ? '0' : '32px' }}>
      <div 
        className="nav-item flex items-center justify-between group cursor-pointer"
        onClick={() => onFileClick(repo.id, node.path)}
        onMouseEnter={(e) => handleNodeMouseEnter(e, node.name)}
        onMouseLeave={handleNodeMouseLeave}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center ${isMd ? 'bg-[#F3F4F6]' : isHtml ? 'bg-orange-50' : isImage ? 'bg-green-50' : 'bg-blue-50'}`}>
            {isMd ? <FileText className="w-3.5 h-3.5 text-[#9CA3AF]" /> : isHtml ? <Monitor className="w-3.5 h-3.5 text-orange-400" /> : isImage ? <ImageIcon className="w-3.5 h-3.5 text-green-400" /> : <FileText className="w-3.5 h-3.5 text-blue-400" />}
          </div>
          <span className="text-sm flex-1 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis node-label">{node.name}</span>
        </div>
        <div className="opacity-0 group-hover:opacity-100 flex items-center shrink-0 ml-2 transition-all">
          {isHtml && (
            <button
              className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[var(--accent-blue)] hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation()
                const rawUrl = currentPlatform === 'github'
                  ? `/api/github/raw/${repo.path}/${node.path.split('/').map(encodeURIComponent).join('/')}`
                  : `/api/gitlab/raw/${repo.id}/${node.path.split('/').map(encodeURIComponent).join('/')}`
                window.open(rawUrl, '_blank')
              }}
              title="在新标签页打开原型"
            >
              <Monitor className="w-4 h-4" />
            </button>
          )}
          <button className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[var(--accent-blue)] hover:bg-gray-100" onClick={handleShare} title="分享链接">
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Reader() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { repos, fetchTree, loadingTree, currentFile, fetchFile, loadingFile } = useReaderStore()
  const { config, fetchConfig } = useConfigStore()
  
  const platformConfig = config?.platform === 'github' ? config?.github : config?.gitlab
  const whitelistRepos = platformConfig?.repositories || []
  const currentRepoName = searchParams.get('repo') || ''
  const currentRepoInfo = whitelistRepos.find(r => String(r.id) === currentRepoName || r.name === currentRepoName || r.path === currentRepoName)

  const [previewImage, setPreviewImage] = useState<{ src: string, alt?: string } | null>(null)

  const [initialLoaded, setInitialLoaded] = useState(false)
  const [notFoundState, setNotFoundState] = useState<{ type: '403' | '404' } | null>(null)
  const [shareMenu, setShareMenu] = useState<{ x: number, y: number, repo: RepoTree, node: GitlabNode, gitUrl: string } | null>(null)
  const shareMenuOpenRef = React.useRef(false)
  const [copiedGit, setCopiedGit] = useState(false)
  const [copiedSys, setCopiedSys] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const updateUrlSilently = (repoName: string, filePath?: string) => {
    const url = new URL(window.location.href)
    if (repoName) {
      url.searchParams.set('repo', repoName)
    } else {
      url.searchParams.delete('repo')
    }
    
    if (filePath) {
      url.searchParams.set('file', filePath)
    } else {
      url.searchParams.delete('file')
    }
    window.history.replaceState({}, '', url.toString())
  }

  const handleFileClick = (repoId: string, filePath: string) => {
    const repo = repos.find(r => r.id === repoId)
    if (repo) {
      updateUrlSilently(repo.name, filePath)
    }
    setNotFoundState(null)
    fetchFile(repoId, filePath)
  }

  const handleShareClick = (e: React.MouseEvent, repo: RepoTree, node: GitlabNode, gitUrl: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    shareMenuOpenRef.current = true
    setShareMenu({
      x: rect.right,
      y: rect.bottom,
      repo,
      node,
      gitUrl
    })
  }

  const [sidebarPinned, setSidebarPinned] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  
  const [sidebarWidth, setSidebarWidth] = useState(340)
  const [isDragging, setIsDragging] = useState(false)

  const [headerPinned, setHeaderPinned] = useState(false)
  const [headerExpanded, setHeaderExpanded] = useState(false)

  const [showAuth, setShowAuth] = useState(false)
  const [adminPwd, setAdminPwd] = useState('')
  const [pwdError, setPwdError] = useState(false)

  const [toc, setToc] = useState<{ id: string, text: string, level: number }[]>([])
  const [drillDownNode, setDrillDownNode] = useState<{ repo: RepoTree, node: GitlabNode } | null>(null)
  
  const [repoDropdownOpen, setRepoDropdownOpen] = useState(false)
  const repoDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (repoDropdownRef.current && !repoDropdownRef.current.contains(event.target as Node)) {
        setRepoDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    fetchConfig()
    const repoParam = searchParams.get('repo')
    if (repoParam) {
      fetchTree(repoParam)
    }
  }, [fetchConfig, fetchTree, searchParams])

  useEffect(() => {
    if (!isDragging) {
      document.body.classList.remove('dragging-sidebar')
      return
    }
    
    document.body.classList.add('dragging-sidebar')
    
    const handleMouseMove = (e: MouseEvent) => {
      let newWidth = e.clientX
      if (newWidth < 220) newWidth = 220
      if (newWidth > 500) newWidth = 500
      
      // Enforce main content minimum width of 300px
      const maxAllowedWidth = window.innerWidth - 300
      if (newWidth > maxAllowedWidth) {
        newWidth = Math.max(220, maxAllowedWidth)
      }
      
      setSidebarWidth(newWidth)
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.classList.remove('dragging-sidebar')
    }
  }, [isDragging])

  useEffect(() => {
    const handleResize = () => {
      setSidebarWidth(prev => {
        const maxAllowedWidth = window.innerWidth - 300
        if (prev > maxAllowedWidth) {
          return Math.max(220, maxAllowedWidth)
        }
        return prev
      })
    }
    
    window.addEventListener('resize', handleResize)
    // Run once on mount to ensure initial width is safe
    handleResize()
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!loadingTree && repos.length > 0 && !initialLoaded) {
      setInitialLoaded(true)
      const repoParam = searchParams.get('repo')
      const fileParam = searchParams.get('file')

      if (repoParam) {
        const repo = repos.find(r => r.name === repoParam || r.id === repoParam)
        
        if (!repo) {
          setNotFoundState({ type: '403' })
          return
        }

        if (fileParam) {
          const findNode = (nodes: GitlabNode[], path: string): GitlabNode | null => {
            for (const node of nodes) {
              if (node.path === path) return node
              if (node.children) {
                const found = findNode(node.children, path)
                if (found) return found
              }
            }
            return null
          }

          const targetNode = findNode(repo.tree, fileParam)

          if (!targetNode) {
            setNotFoundState({ type: '404' })
            return
          }

          if (targetNode.type === 'tree') {
            setDrillDownNode({ repo, node: targetNode })
          } else {
            const parentPath = fileParam.split('/').slice(0, -1).join('/')
            if (parentPath) {
              const parentNode = findNode(repo.tree, parentPath)
              if (parentNode) {
                setDrillDownNode({ repo, node: parentNode })
              }
            } else {
              const rootNode: GitlabNode = {
                id: `root-${repo.id}`,
                name: repo.name,
                type: 'tree',
                path: '',
                mode: '040000',
                children: repo.tree
              }
              setDrillDownNode({ repo, node: rootNode })
            }
            fetchFile(repo.id, targetNode.path)
          }
        } else {
          const rootNode: GitlabNode = {
             id: `root-${repo.id}`,
             name: repo.name,
             type: 'tree',
             path: '',
             mode: '040000',
             children: repo.tree
          }
          setDrillDownNode({ repo, node: rootNode })
          
          // F2: 默认渲染 README.md
          const readmeNode = repo.tree.find((n: GitlabNode) => /^readme\.md$/i.test(n.name))
          if (readmeNode) {
            updateUrlSilently(repo.name, readmeNode.path)
            fetchFile(repo.id, readmeNode.path)
          }
        }
      }
    }
  }, [loadingTree, repos, searchParams, initialLoaded, fetchFile])

  useEffect(() => {
    if (currentFile?.type === 'md') {
      const renderMermaid = async () => {
        try {
          await mermaid.run({
            querySelector: '.language-mermaid',
          });
        } catch (e) {
          console.error('Mermaid render error', e)
        }
      }
      // Give DOM time to update
      setTimeout(renderMermaid, 100)

      // Extract TOC
      const tokens = marked.lexer(currentFile.content)
      const extractedToc: { level: number, id: string, text: string }[] = []
      tokens.forEach((token) => {
        if (token.type === 'heading' && token.depth >= 1 && token.depth <= 3) {
          const text = token.text
          // Generate an id matching the marked renderer logic
          const id = String(text).toLowerCase().replace(/[^\w]+/g, '-')
          extractedToc.push({ level: token.depth, id, text })
        }
      })
      setToc(extractedToc)
    }
  }, [currentFile])

  const handleAuth = () => {
    if (adminPwd === 'Aa@000000') {
      navigate('/admin')
    } else {
      setPwdError(true)
    }
  }

  const renderContent = () => {
    if (loadingFile || (loadingTree && searchParams.get('repo'))) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-gray-100 border-t-[var(--accent-blue)] rounded-full animate-spin"></div>
          <div className="text-gray-400 font-bold">正在拉取目标文档...</div>
        </div>
      )
    }

    if (notFoundState) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center mt-20">
          <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center mb-6 shadow-sm ${notFoundState.type === '403' ? 'bg-pink-50 text-pink-500' : 'bg-gray-50 text-gray-400'}`}>
            {notFoundState.type === '403' ? <Lock className="w-10 h-10" /> : <FileText className="w-10 h-10" />}
          </div>
          <h2 className="text-2xl font-bold text-[#4A4E69] mb-2">
            {notFoundState.type === '403' ? '无权限访问' : '文件不存在'}
          </h2>
          <p className="text-[#9CA3AF] mb-8 font-medium max-w-md text-center">
            {notFoundState.type === '403' ? '该仓库不在白名单内或无访问权限' : '在当前仓库下找不到该文件，可能已被删除或重命名'}
          </p>
          <button 
            onClick={() => {
               setNotFoundState(null)
               setDrillDownNode(null)
               updateUrlSilently('')
            }}
            className="bg-white border-2 border-gray-100 hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)] text-[#4A4E69] font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm"
          >
            返回全局视图
          </button>
        </div>
      )
    }

    if (!currentFile) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-10 h-10 text-gray-300" />
          </div>
          {repos.length === 0 ? "暂无可见仓库，请联系管理员配置" : "请在左侧选择文件阅读"}
        </div>
      )
    }

    if (currentFile.type === 'html') {
      return (
        <div className="w-full h-full p-4 pb-0 flex flex-col">
          <iframe 
            src={currentFile.content}
            className="w-full flex-1 border border-gray-200 rounded-2xl bg-white shadow-sm" 
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title="HTML Preview"
          />
        </div>
      )
    }

    if (currentFile.type === 'md') {
      // Configure marked to add ids to headers
      const renderer = new marked.Renderer()
      renderer.heading = ({ text, depth }) => {
        const escapedText = String(text).toLowerCase().replace(/[^\w]+/g, '-')
        return `<h${depth} id="${escapedText}">${text}</h${depth}>`
      }
      
      const rawHtml = marked(currentFile.content, { renderer }) as string
      const cleanHtml = DOMPurify.sanitize(rawHtml)

      return (
        <article 
          className="prose prose-soft max-w-3xl mx-auto pb-32 w-full markdown-body"
          dangerouslySetInnerHTML={{ __html: cleanHtml }}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'IMG') {
              const img = target as HTMLImageElement;
              setPreviewImage({ src: img.src, alt: img.alt });
            }
          }}
        />
      )
    }

    if (currentFile.type === 'image') {
      return (
        <div className="flex items-center justify-center h-full w-full bg-gray-50/50 rounded-2xl p-8">
          <img 
            src={currentFile.content} 
            alt={currentFile.filePath} 
            className="max-w-full max-h-full object-contain shadow-sm border border-gray-100 rounded-lg cursor-zoom-in hover:shadow-md transition-shadow"
            onClick={() => setPreviewImage({ src: currentFile.content, alt: currentFile.filePath })}
          />
        </div>
      )
    }

    return <div className="p-8 text-center text-gray-400 font-bold">不支持的文件格式</div>
  }

  if (!searchParams.get('repo')) {
    return <Home />
  }

  return (
    <div 
      className="flex h-screen w-screen overflow-hidden relative bg-[var(--bg-pastel)]"
      style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}
    >
      <SmartTooltipContainer />
      
      {/* Sidebar Trigger Area */}
      {!sidebarPinned && (
        <div 
          className="absolute left-0 top-0 bottom-0 w-10 z-40" 
          onMouseEnter={() => setSidebarExpanded(true)}
          onMouseLeave={(e) => {
          // Check if mouse goes into the sidebar
          if (e.relatedTarget) {
            const target = e.relatedTarget as HTMLElement
            if (target.closest('aside')) return
          }
          if (!shareMenuOpenRef.current) setSidebarExpanded(false)
        }}
        />
      )}

      {/* Sidebar */}
      <div 
        id="sidebar-container"
        className="absolute left-0 top-0 bottom-0 z-50 p-3 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{ 
          width: 'var(--sidebar-width)', 
          transform: (sidebarPinned || sidebarExpanded || shareMenu) ? 'translateX(0)' : 'translateX(calc(-1 * (var(--sidebar-width) - 20px)))' 
        }}
        onMouseLeave={() => {
          if (!sidebarPinned && !shareMenuOpenRef.current && !isDragging) {
            setSidebarExpanded(false)
          }
        }}
      >
        <aside className="w-full bg-[var(--sidebar-bg)] rounded-[32px] flex flex-col h-full card-shadow overflow-hidden border-4 border-white relative">
          <div className="h-24 flex items-center justify-between px-6 pt-4 shrink-0 border-b border-white/50 relative">
            <div className="flex-1 relative mr-2" ref={repoDropdownRef}>
              <button 
                onClick={() => setRepoDropdownOpen(!repoDropdownOpen)} 
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-[16px] bg-white/50 border-2 border-white hover:bg-white hover:shadow-sm hover:-translate-y-px transition-all"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <Cloud className="w-5 h-5 text-[var(--accent-blue)] shrink-0" />
                  <span className="font-bold text-[#4A4E69] tracking-wide font-['Quicksand'] text-base truncate">
                    {currentRepoInfo?.name || currentRepoName || '选择仓库'}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-[#9CA3AF] shrink-0 transition-transform ${repoDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <div className={`absolute top-[calc(100%+4px)] left-0 w-full bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(162,210,255,0.5)] border-2 border-[var(--sidebar-bg)] overflow-hidden flex flex-col z-[100] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-top ${repoDropdownOpen ? 'opacity-100 visible scale-y-100' : 'opacity-0 invisible scale-y-95'}`}>
                <ul className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                  {whitelistRepos.map((repo) => {
                    const isSelected = String(repo.id) === currentRepoName || repo.name === currentRepoName || repo.path === currentRepoName
                    const colors = [
                      'bg-[var(--accent-blue)] text-white', 
                      'bg-[var(--accent-pink)] text-white', 
                      'bg-[#BDE0FE] text-white', 
                      'bg-[#FDF1D6] text-[#D4A373]', 
                      'bg-[#E2E8F0] text-[#4F46E5]'
                    ]
                    const colorClass = colors[repo.name.charCodeAt(0) % colors.length]
                    
                    return (
                      <li 
                        key={repo.id}
                        onClick={() => {
                          setRepoDropdownOpen(false)
                          updateUrlSilently(repo.name)
                          useReaderStore.setState({ currentFile: null })
                          fetchTree(repo.name)
                        }} 
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all hover:bg-gray-50 hover:translate-x-0.5 ${isSelected ? 'bg-[var(--sidebar-bg)]' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-['Quicksand'] font-bold ${colorClass}`}>
                          {repo.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 flex flex-col min-w-0">
                          <span className="font-['Quicksand'] font-bold text-[#4A4E69] whitespace-nowrap overflow-hidden text-ellipsis">{repo.name}</span>
                          <span className="text-[10px] text-[#9CA3AF] font-mono whitespace-nowrap overflow-hidden text-ellipsis">{repo.path}</span>
                        </div>
                        <Check className={`w-4 h-4 text-[var(--accent-blue)] shrink-0 transition-all ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
                      </li>
                    )
                  })}
                </ul>
                <div className="h-px bg-gray-100 w-full"></div>
                <div className="p-2 bg-gray-50/50">
                  <button onClick={() => navigate('/')} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[#6B7280] font-semibold hover:bg-white hover:text-[#4A4E69] transition-all group">
                    <LayoutGrid className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    返回仓库列表页
                  </button>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setSidebarPinned(!sidebarPinned)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${sidebarPinned ? 'bg-white text-[var(--accent-pink)] shadow-sm' : 'text-[#9CA3AF] hover:text-[#4A4E69]'}`}
            >
              <Pin className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 pt-4">
            {loadingTree ? (
              <div className="text-center text-sm text-gray-500 mt-10">加载文件树...</div>
            ) : drillDownNode ? (
              <div className="mb-4">
                <div 
                  className="flex items-center gap-2 px-2 py-2 mb-3 text-[var(--accent-blue)] font-bold cursor-pointer hover:bg-white/50 rounded-xl transition-colors"
                  onClick={() => {
                    setDrillDownNode(null)
                    // Optional: we might not want to clear URL file param here since currentFile is still open.
                  }}
                >
                  <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-sm">
                    <ArrowLeft className="w-4 h-4" />
                  </div>
                  <span>返回上级</span>
                </div>
                <div className="mt-1">
                  {drillDownNode.node.children?.map(node => (
                    <TreeNode key={node.id} node={node} repo={drillDownNode.repo} onFileClick={handleFileClick} onShareClick={handleShareClick} onDrillDown={(n) => {
                      updateUrlSilently(drillDownNode.repo.name, n.path)
                      setDrillDownNode({ repo: drillDownNode.repo, node: n })
                    }} />
                  ))}
                </div>
              </div>
            ) : repos.length > 0 ? (
              <div className="mt-1">
                {repos[0].tree.map(node => (
                  <TreeNode key={node.id} node={node} repo={repos[0]} onFileClick={handleFileClick} onShareClick={handleShareClick} onDrillDown={(n) => {
                    updateUrlSilently(repos[0].name, n.path)
                    setDrillDownNode({ repo: repos[0], node: n })
                  }} />
                ))}
              </div>
            ) : (
              <div className="text-center text-sm text-gray-500 mt-10">暂无文件</div>
            )}
          </div>

          <div className="shrink-0 p-4 border-t-2 border-white/50 bg-[var(--sidebar-bg)] z-10">
            <button onClick={() => { setShowAuth(true); setPwdError(false); setAdminPwd(''); }} className="w-full nav-item flex items-center gap-3 text-[#9CA3AF] hover:text-[#4A4E69] m-0 p-2 rounded-xl transition-colors hover:bg-white/50">
              <div className="w-8 h-8 rounded-xl bg-[#F3F4F6] flex items-center justify-center"><Settings className="w-4 h-4" /></div>
              <span className="font-bold">后台配置</span>
            </button>
          </div>

          {/* Soft Resizer */}
          <div 
            className="absolute right-0 top-0 bottom-0 w-4 cursor-col-resize z-50 flex items-center justify-center group"
            onMouseDown={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
          >
            <div className={`w-1 h-16 rounded-l-full transition-all duration-300 ${isDragging ? 'bg-[var(--accent-blue)]/50 scale-x-150 scale-y-110' : 'bg-white/50 group-hover:bg-[var(--accent-blue)]/30 group-hover:scale-x-150'}`} />
          </div>
        </aside>
      </div>

      {/* Main Content */}
      <div 
        className="flex-1 h-full p-3 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex relative min-w-[300px]"
        style={{ paddingLeft: sidebarPinned ? 'var(--sidebar-width)' : '20px' }}
      >
        <main className="flex-1 flex flex-col relative bg-white rounded-[32px] card-shadow overflow-hidden border-4 border-[var(--bg-pastel)] min-w-[300px]">
          
          {/* Header Trigger */}
          {!headerPinned && (
            <div 
              className="absolute left-0 right-0 top-0 h-5 z-40" 
              onMouseEnter={() => setHeaderExpanded(true)}
            />
          )}

          {/* Header */}
          <div 
            className={`absolute left-0 right-0 top-0 z-45 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              headerPinned || headerExpanded ? 'translate-y-0' : '-translate-y-full'
            }`}
            onMouseLeave={() => !headerPinned && setHeaderExpanded(false)}
          >
            <header className="h-20 flex items-center justify-between px-10 border-b border-gray-50 bg-white/90 backdrop-blur-md">
              <div className="flex items-center gap-2 bg-[#F3F4F6] px-4 py-2 rounded-full text-sm font-bold text-[#6B7280]">
                {currentFile ? (
                  <div className="flex items-center">
                    <HomeIcon className="w-4 h-4 text-[#9CA3AF] mr-2" />
                    {currentFile.filePath.split('/').map((part, idx, arr) => (
                      <React.Fragment key={idx}>
                        <span className="text-[#D1D5DB] mx-2">/</span>
                        <span className={idx === arr.length - 1 ? 'text-[var(--accent-blue)]' : 'text-[#6B7280]'}>
                          {part}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  <span>暂未选择文件</span>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative w-64">
                  <input type="text" placeholder="搜索文档 (敬请期待)..." disabled className="w-full bg-[#F3F4F6] border-2 border-transparent rounded-full px-5 py-2.5 text-sm font-bold text-[#4A4E69] focus:outline-none focus:border-[var(--accent-blue)] focus:bg-white transition-all opacity-50" />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Search className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                  </div>
                </div>
                <button 
                  onClick={() => setHeaderPinned(!headerPinned)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${headerPinned ? 'bg-white text-[var(--accent-pink)] shadow-sm' : 'text-[#9CA3AF] hover:text-[#4A4E69]'}`}
                >
                  <Pin className="w-4 h-4" />
                </button>
              </div>
            </header>
          </div>

          {/* Content & TOC */}
          <div className={`flex-1 flex overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${headerPinned ? 'pt-20' : 'pt-0'}`}>
            
            <div className={`flex-1 overflow-y-auto ${currentFile?.type === 'html' ? 'p-0' : 'p-12 pr-6'}`}>
              {renderContent()}
            </div>
            
            {/* TOC */}
            {currentFile?.type === 'md' && toc.length > 0 && (
              <div className="w-64 flex-shrink-0 p-8 pt-12 overflow-y-auto border-l border-gray-50/50 bg-[#FAFAFA]/50 block">
                <div className="sticky top-0">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-4 flex items-center gap-2">
                    <List className="w-3.5 h-3.5" />
                    文档目录
                  </div>
                  <nav className="space-y-3">
                    {toc.map((item, i) => (
                      <a 
                        key={i} 
                        href={`#${item.id}`} 
                        className={`block text-sm transition-colors ${
                          item.level === 1 
                            ? 'font-bold text-[#4A4E69] hover:text-[var(--accent-blue)]' 
                            : 'font-semibold text-[#6B7280] hover:text-[var(--accent-blue)] pl-4 relative before:content-[""] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-1 before:bg-[var(--accent-pink)] before:rounded-full'
                        }`}
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#4A4E69]/40 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-sm card-shadow relative">
            <button onClick={() => setShowAuth(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center text-[#9CA3AF] hover:text-[#4A4E69] hover:bg-gray-200 transition-colors">
              <X className="w-4 h-4" />
            </button>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[var(--sidebar-bg)] rounded-[20px] flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-[var(--accent-blue)]" />
              </div>
              <h3 className="font-['Quicksand'] text-2xl font-bold text-[#4A4E69]">管理员验证</h3>
              <p className="text-sm text-[#9CA3AF] font-semibold mt-1">请输入访问密码进入配置中心</p>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <Key className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input 
                  type="password" 
                  value={adminPwd}
                  onChange={e => setAdminPwd(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAuth()}
                  placeholder="输入密码" 
                  className={`w-full bg-[#F9FAFB] border-2 rounded-2xl py-3 pl-12 pr-4 font-bold text-[#4A4E69] focus:outline-none focus:bg-white transition-all ${pwdError ? 'border-red-300' : 'border-transparent focus:border-[var(--accent-blue)]'}`}
                />
              </div>
              {pwdError && <p className="text-xs text-red-500 font-bold px-2">密码错误，请重试。(初始密码为: Aa@000000)</p>}
              
              <button onClick={handleAuth} className="w-full bg-[var(--accent-blue)] text-white font-bold py-3 rounded-2xl hover:shadow-[0_8px_20px_rgba(162,210,255,0.4)] hover:-translate-y-1 transition-all">
                确认进入
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Popover */}
      {shareMenu && (
        <>
          <div 
            className="fixed inset-0 z-[110]" 
            onClick={() => {
              shareMenuOpenRef.current = false
              setShareMenu(null)
              setTimeout(() => {
                if (!sidebarPinned && !document.querySelector('#sidebar-container')?.matches(':hover')) {
                  setSidebarExpanded(false)
                }
              }, 10)
            }} 
          />
          <div 
            className="fixed z-[120] bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 py-2 w-48 overflow-hidden"
            style={{ 
              top: Math.min(shareMenu.y + 8, window.innerHeight - 100), 
              left: Math.max(shareMenu.x - 192, 16) 
            }}
          >
            <button 
              className="w-full text-left px-4 py-2.5 text-sm font-bold text-[#4A4E69] hover:bg-gray-50 flex items-center gap-3 transition-colors"
              onClick={async () => {
                const success = await copyToClipboard(shareMenu.gitUrl)
                if (success) {
                  setCopiedGit(true)
                  showToast('已复制 Git 地址')
                  setTimeout(() => {
                    setCopiedGit(false)
                    shareMenuOpenRef.current = false
                    setShareMenu(null)
                    setTimeout(() => {
                      if (!sidebarPinned && !document.querySelector('#sidebar-container')?.matches(':hover')) {
                        setSidebarExpanded(false)
                      }
                    }, 10)
                  }, 2000)
                } else {
                  showToast('复制失败，请手动复制')
                  shareMenuOpenRef.current = false
                  setShareMenu(null)
                  setTimeout(() => {
                    if (!sidebarPinned && !document.querySelector('#sidebar-container')?.matches(':hover')) {
                      setSidebarExpanded(false)
                    }
                  }, 10)
                }
              }}
            >
              {copiedGit ? <Check className="w-4 h-4 text-green-500" /> : <Cloud className="w-4 h-4 text-gray-400" />}
              {copiedGit ? '复制成功' : '复制 Git 地址'}
            </button>
            <button 
              className="w-full text-left px-4 py-2.5 text-sm font-bold text-[#4A4E69] hover:bg-gray-50 flex items-center gap-3 transition-colors"
              onClick={async () => {
                const sysUrl = new URL(window.location.href)
                sysUrl.searchParams.set('repo', shareMenu.repo.name)
                sysUrl.searchParams.set('file', shareMenu.node.path)
                const success = await copyToClipboard(sysUrl.toString())
                if (success) {
                  setCopiedSys(true)
                  showToast('已复制系统链接')
                  setTimeout(() => {
                    setCopiedSys(false)
                    shareMenuOpenRef.current = false
                    setShareMenu(null)
                    setTimeout(() => {
                      if (!sidebarPinned && !document.querySelector('#sidebar-container')?.matches(':hover')) {
                        setSidebarExpanded(false)
                      }
                    }, 10)
                  }, 2000)
                } else {
                  showToast('复制失败，请手动复制')
                  shareMenuOpenRef.current = false
                  setShareMenu(null)
                  setTimeout(() => {
                    if (!sidebarPinned && !document.querySelector('#sidebar-container')?.matches(':hover')) {
                      setSidebarExpanded(false)
                    }
                  }, 10)
                }
              }}
            >
              {copiedSys ? <Check className="w-4 h-4 text-green-500" /> : <Link className="w-4 h-4 text-[var(--accent-blue)]" />}
              {copiedSys ? '复制成功' : '复制系统链接'}
            </button>
          </div>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-[#4A4E69] text-white px-6 py-3 rounded-full shadow-lg font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          {toast}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <ImageViewer 
          src={previewImage.src} 
          alt={previewImage.alt} 
          onClose={() => setPreviewImage(null)} 
        />
      )}
    </div>
  )
}
