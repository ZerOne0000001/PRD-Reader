import { Router, Request, Response, NextFunction } from 'express'
import { getConfig } from '../services/configService.js'
import { fetchProjectTree, fetchFileRaw } from '../services/gitlabService.js'

const router = Router()

const checkConfig = (req: Request, res: Response, next: NextFunction) => {
  const config = getConfig()
  const gitlabConfig = config.gitlab
  if (!gitlabConfig.instanceUrl || !gitlabConfig.token) {
    res.status(403).json({ success: false, error: 'GitLab is not configured' })
    return
  }
  // @ts-ignore
  req.gitlabConfig = gitlabConfig
  next()
}

router.use(checkConfig)

router.get('/tree', async (req, res) => {
  // @ts-ignore
  const config = req.gitlabConfig
  const repoParam = req.query.repo as string

  try {
    const result = []
    const targetRepos = repoParam 
      ? config.repositories.filter((r: any) => String(r.id) === repoParam || r.name === repoParam || r.path === repoParam)
      : config.repositories

    for (const repo of targetRepos) {
      try {
        const tree = await fetchProjectTree(config.instanceUrl, config.token, repo.id, repo.default_branch)
        result.push({
          ...repo,
          tree: tree
        })
        repo.status = '正常'
      } catch (e) {
        repo.status = '异常'
        result.push({
          ...repo,
          tree: []
        })
      }
    }
    res.json({ success: true, data: result })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/file', async (req, res) => {
  const projectId = req.query.projectId as string
  const filePath = req.query.filePath as string
  const ref = req.query.ref as string

  if (!projectId || !filePath) {
    res.status(400).json({ success: false, error: 'projectId and filePath are required' })
    return
  }

  // @ts-ignore
  const config = req.gitlabConfig
  const repo = config.repositories.find((r: any) => String(r.id) === String(projectId))

  if (!repo) {
    res.status(403).json({ success: false, error: 'Repository is not in whitelist' })
    return
  }

  try {
    const content = await fetchFileRaw(
      config.instanceUrl,
      config.token,
      String(projectId),
      String(filePath),
      String(ref || repo.default_branch)
    )

    const ext = filePath.toString().split('.').pop()?.toLowerCase()
    const mimeTypes: Record<string, string> = {
      'md': 'text/markdown; charset=utf-8',
      'html': 'text/html; charset=utf-8',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'webp': 'image/webp',
      'js': 'application/javascript; charset=utf-8',
      'css': 'text/css; charset=utf-8',
      'json': 'application/json; charset=utf-8'
    }
    if (ext && mimeTypes[ext]) {
      res.setHeader('Content-Type', mimeTypes[ext])
    }

    res.send(Buffer.from(content))
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/raw/:projectId/*', async (req, res) => {
  const projectId = req.params.projectId
  const filePath = req.params[0]
  const ref = req.query.ref as string

  // @ts-ignore
  const config = req.gitlabConfig
  const repo = config.repositories.find((r: any) => String(r.id) === String(projectId))

  if (!repo) {
    res.status(403).send('Repository is not in whitelist')
    return
  }

  try {
    const content = await fetchFileRaw(
      config.instanceUrl,
      config.token,
      String(projectId),
      String(filePath),
      String(ref || repo.default_branch)
    )

    const ext = filePath.split('.').pop()?.toLowerCase()
    const mimeTypes: Record<string, string> = {
      'html': 'text/html; charset=utf-8',
      'css': 'text/css; charset=utf-8',
      'js': 'application/javascript; charset=utf-8',
      'json': 'application/json; charset=utf-8',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'webp': 'image/webp'
    }

    if (ext && mimeTypes[ext]) {
      res.setHeader('Content-Type', mimeTypes[ext])
    } else {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    }

    res.send(Buffer.from(content))
  } catch (error: any) {
    res.status(404).send(`File not found: ${filePath}`)
  }
})

export default router