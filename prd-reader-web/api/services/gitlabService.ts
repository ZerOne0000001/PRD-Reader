export const testGitlabConnection = async (url: string, token: string): Promise<boolean> => {
  try {
    // 校验连接
    const response = await fetch(`${url}/api/v4/version`, {
      headers: { 'PRIVATE-TOKEN': token }
    })
    return response.ok
  } catch (e) {
    return false
  }
}

export const fetchProjectDetails = async (url: string, token: string, idOrPath: string) => {
  const response = await fetch(`${url}/api/v4/projects/${encodeURIComponent(idOrPath)}`, {
    headers: { 'PRIVATE-TOKEN': token }
  })
  if (!response.ok) throw new Error('Project not found')
  return response.json()
}

export const fetchProjectTree = async (url: string, token: string, projectId: string, ref: string = 'main') => {
  const allItems: any[] = []
  let page = 1
  const perPage = 100 // GitLab API 允许的最大 per_page 通常是 100

  while (true) {
    const response = await fetch(`${url}/api/v4/projects/${projectId}/repository/tree?recursive=true&per_page=${perPage}&page=${page}&ref=${ref}`, {
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
  const response = await fetch(`${url}/api/v4/projects/${projectId}/repository/files/${encodeURIComponent(filePath)}/raw?ref=${ref}`, {
    headers: { 'PRIVATE-TOKEN': token }
  })
  if (!response.ok) throw new Error('Failed to fetch file')
  return response.arrayBuffer()
}