const REQUEST_TIMEOUT_MS = 8000

export interface ConnectionTestResult {
  success: boolean
  error?: string
}

const getApiUrl = (url: string): string => {
  const cleanUrl = url.replace(/\/$/, '')
  if (cleanUrl === 'https://github.com' || cleanUrl === 'http://github.com') {
    return 'https://api.github.com'
  }
  return `${cleanUrl}/api/v3`
}

const fetchWithTimeout = async (input: string, init?: RequestInit) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

export const testGithubConnection = async (url: string, token: string): Promise<ConnectionTestResult> => {
  try {
    const apiUrl = getApiUrl(url)
    const response = await fetchWithTimeout(`${apiUrl}/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })

    if (response.ok) {
      return { success: true }
    }

    if (response.status === 401 || response.status === 403) {
      return { success: false, error: 'GitHub Token 无效或权限不足' }
    }

    return { success: false, error: `GitHub 连接失败 (${response.status})` }
  } catch (e) {
    console.error('GitHub connection test failed:', e)

    if (e instanceof Error && e.name === 'AbortError') {
      return { success: false, error: 'GitHub 连接超时，请检查公网访问或代理配置' }
    }

    return { success: false, error: 'GitHub 连接失败，请检查实例地址和网络' }
  }
}

export const fetchRepoDetails = async (url: string, token: string, owner: string, repo: string) => {
  const apiUrl = getApiUrl(url)
  const response = await fetch(`${apiUrl}/repos/${owner}/${repo}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  })
  if (!response.ok) throw new Error('Repository not found')
  return response.json()
}

export const fetchRepoTree = async (url: string, token: string, owner: string, repo: string, branch: string = 'main') => {
  const apiUrl = getApiUrl(url)
  const allItems: any[] = []
  let page = 1
  const perPage = 100

  while (true) {
    const response = await fetch(`${apiUrl}/repos/${owner}/${repo}/git/trees/${branch}?recursive=true&per_page=${perPage}&page=${page}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })

    if (!response.ok) throw new Error('Failed to fetch tree')

    const data = await response.json()
    if (data.truncated === false || data.tree.length === 0) {
      allItems.push(...data.tree)
      break
    }

    allItems.push(...data.tree)

    if (data.tree.length < perPage) {
      break
    }

    page++
  }

  return allItems
}

export const fetchFileContent = async (url: string, token: string, owner: string, repo: string, filePath: string, branch: string = 'main') => {
  const apiUrl = getApiUrl(url)
  const response = await fetch(`${apiUrl}/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  })
  if (!response.ok) throw new Error('Failed to fetch file')
  const data = await response.json()
  if (data.encoding === 'base64' && data.content) {
    return Buffer.from(data.content, 'base64')
  }
  throw new Error('File content is not available')
}

export const fetchFileRaw = async (url: string, token: string, owner: string, repo: string, filePath: string, branch: string = 'main') => {
  const apiUrl = getApiUrl(url)
  const response = await fetch(`${apiUrl}/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3.raw'
    }
  })
  if (!response.ok) throw new Error('Failed to fetch file raw')
  return response.arrayBuffer()
}
