import { create } from 'zustand'

export interface GitlabNode {
  id: string
  name: string
  type: 'tree' | 'blob'
  path: string
  mode: string
  children?: GitlabNode[]
}

export interface RepoTree {
  id: string
  name: string
  path: string
  default_branch: string
  status: '正常' | '异常'
  tree: GitlabNode[]
}

interface ReaderState {
  platform: 'gitlab' | 'github'
  repos: RepoTree[]
  loadingTree: boolean
  error: string | null
  currentFile: { repoId: string; filePath: string; content: string; type: 'md' | 'html' | 'image' | 'other' } | null
  loadingFile: boolean
  fetchTree: (repoParam?: string) => Promise<void>
  fetchFile: (repoId: string, filePath: string) => Promise<void>
  setPlatform: (platform: 'gitlab' | 'github') => void
}

const buildNestedTree = (flatTree: GitlabNode[]) => {
  const root: GitlabNode[] = []
  const map = new Map<string, GitlabNode>()

  flatTree.forEach(node => {
    node.children = []
    map.set(node.path, node)
  })

  flatTree.forEach(node => {
    const parts = node.path.split('/')
    if (parts.length === 1) {
      root.push(node)
    } else {
      parts.pop()
      const parentPath = parts.join('/')
      const parent = map.get(parentPath)

      if (parent && parent.children) {
        parent.children.push(node)
      } else {
        let currentParentPath = ''
        let currentParentNodes = root

        const pathParts = node.path.split('/')
        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i]
          currentParentPath = currentParentPath ? `${currentParentPath}/${part}` : part

          let foundNode = map.get(currentParentPath)

          if (!foundNode) {
            foundNode = {
              id: `virtual-${currentParentPath}`,
              name: part,
              type: 'tree',
              path: currentParentPath,
              mode: '040000',
              children: []
            }
            map.set(currentParentPath, foundNode)
            currentParentNodes.push(foundNode)
          }

          if (foundNode.children) {
            currentParentNodes = foundNode.children
          }
        }

        currentParentNodes.push(node)
      }
    }
  })

  const sortTree = (nodes: GitlabNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'blob' ? -1 : 1
      }
      return b.name.localeCompare(a.name)
    })

    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        sortTree(node.children)
      }
    })
  }

  sortTree(root)

  return root
}

export const useReaderStore = create<ReaderState>((set) => ({
  platform: 'gitlab',
  repos: [],
  loadingTree: false,
  error: null,
  currentFile: null,
  loadingFile: false,

  setPlatform: (platform: 'gitlab' | 'github') => {
    set({ platform })
  },

  fetchTree: async (repoParam?: string) => {
    set({ loadingTree: true, error: null })
    try {
      const res = await fetch('/api/config')
      const configData = await res.json()

      if (!configData.success) {
        throw new Error('Failed to fetch config')
      }

      const currentPlatform = configData.data.platform
      set({ platform: currentPlatform })

      let apiEndpoint = currentPlatform === 'github' ? '/api/github/tree' : '/api/gitlab/tree'
      if (repoParam) {
        apiEndpoint += `?repo=${encodeURIComponent(repoParam)}`
      }
      
      const res2 = await fetch(apiEndpoint)
      const data = await res2.json()

      if (data.success) {
        const reposWithNestedTree = data.data.map((repo: any) => ({
          ...repo,
          tree: buildNestedTree(repo.tree)
        }))
        set({ repos: reposWithNestedTree, loadingTree: false })
        console.log("Tree fetched successfully", reposWithNestedTree)
      } else {
        set({ error: data.error, loadingTree: false })
        console.error("Tree fetch failed", data.error)
      }
    } catch (e: any) {
      set({ error: e.message, loadingTree: false })
      console.error("Tree fetch exception", e)
    }
  },

  fetchFile: async (repoId: string, filePath: string) => {
    set({ loadingFile: true, currentFile: null })
    try {
      const state = useReaderStore.getState()
      const isImage = /\.(png|jpe?g|gif|svg|webp)$/i.test(filePath)
      const isHtml = /\.html$/i.test(filePath)

      if (isImage || isHtml) {
        const apiEndpoint = state.platform === 'github' ? '/api/github/raw' : '/api/gitlab/raw'
        let rawUrl: string

        if (state.platform === 'github') {
          const repo = state.repos.find(r => r.id === repoId)
          rawUrl = `${apiEndpoint}/${repo?.path}/${filePath.split('/').map(encodeURIComponent).join('/')}`
        } else {
          rawUrl = `${apiEndpoint}/${repoId}/${filePath.split('/').map(encodeURIComponent).join('/')}`
        }

        set({
          currentFile: { repoId, filePath, content: rawUrl, type: isImage ? 'image' : 'html' },
          loadingFile: false
        })
        return
      }

      const apiEndpoint = state.platform === 'github' ? '/api/github/file' : '/api/gitlab/file'
      let url: string

      if (state.platform === 'github') {
        const repo = state.repos.find(r => r.id === repoId)
        url = `${apiEndpoint}?repoPath=${encodeURIComponent(repo?.path || '')}&filePath=${encodeURIComponent(filePath)}`
      } else {
        url = `${apiEndpoint}?projectId=${repoId}&filePath=${encodeURIComponent(filePath)}`
      }

      const res = await fetch(url)
      if (!res.ok) {
        throw new Error('Failed to fetch file content')
      }
      const content = await res.text()
      const type = filePath.endsWith('.md') ? 'md' : filePath.endsWith('.html') ? 'html' : 'other'
      set({
        currentFile: { repoId, filePath, content, type },
        loadingFile: false
      })
    } catch (e: any) {
      set({ error: e.message, loadingFile: false })
    }
  }
}))