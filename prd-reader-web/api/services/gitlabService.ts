const REQUEST_TIMEOUT_MS = 8000

export interface ConnectionTestResult {
  success: boolean
  error?: string
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

export const testGitlabConnection = async (url: string, token: string): Promise<ConnectionTestResult> => {
  try {
    const cleanUrl = url.replace(/\/$/, '')
    // 用 /user 校验 token 权限，比 /version 更能反映真实可用性。
    const response = await fetchWithTimeout(`${cleanUrl}/api/v4/user`, {
      headers: { 'PRIVATE-TOKEN': token }
    })

    if (response.ok) {
      return { success: true }
    }

    if (response.status === 401 || response.status === 403) {
      return { success: false, error: 'GitLab Token 无效、权限不足，或内网实例不允许当前访问' }
    }

    return { success: false, error: `GitLab 连接失败 (${response.status})` }
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      return { success: false, error: 'GitLab 连接超时，请检查内网地址、VPN 或安全组配置' }
    }

    return { success: false, error: 'GitLab 连接失败，请检查实例地址和网络' }
  }
}

export const fetchProjectDetails = async (url: string, token: string, idOrPath: string) => {
  const cleanUrl = url.replace(/\/$/, '')
  const response = await fetch(`${cleanUrl}/api/v4/projects/${encodeURIComponent(idOrPath)}`, {
    headers: { 'PRIVATE-TOKEN': token }
  })
  if (!response.ok) throw new Error('Project not found')
  return response.json()
}

export const fetchProjectTree = async (url: string, token: string, projectId: string, ref: string = 'main') => {
  const cleanUrl = url.replace(/\/$/, '')
  const allItems: any[] = []
  let page = 1
  const perPage = 100 // GitLab API 允许的最大 per_page 通常是 100

  while (true) {
    const response = await fetch(`${cleanUrl}/api/v4/projects/${projectId}/repository/tree?recursive=true&per_page=${perPage}&page=${page}&ref=${ref}`, {
      headers: { 'PRIVATE-TOKEN': token }
    })
    
    if (!response.ok) throw new Error('Failed to fetch tree')
    
    const data = await response.json()
    if (data.length === 0) break // 安全兜底：如果没有数据了也退出
    
    allItems.push(...data)

    // GitLab 通过响应头 x-next-page 来指示是否还有下一页
    const nextPage = response.headers.get('x-next-page')
    if (!nextPage) {
      break
    }
    
    page = parseInt(nextPage, 10)
  }

  return allItems
}

export const fetchFileRaw = async (url: string, token: string, projectId: string, filePath: string, ref: string = 'main') => {
  const cleanUrl = url.replace(/\/$/, '')
  const response = await fetch(`${cleanUrl}/api/v4/projects/${projectId}/repository/files/${encodeURIComponent(filePath)}/raw?ref=${ref}`, {
    headers: { 'PRIVATE-TOKEN': token }
  })
  if (!response.ok) throw new Error('Failed to fetch file')
  return response.arrayBuffer()
}
