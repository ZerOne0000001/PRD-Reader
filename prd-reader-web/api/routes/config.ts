import { Router } from 'express'
import { getConfig, saveConfig } from '../services/configService.js'
import { testGitlabConnection } from '../services/gitlabService.js'
import { testGithubConnection, fetchRepoDetails } from '../services/githubService.js'

const router = Router()

router.get('/', (req, res) => {
  res.json({ success: true, data: getConfig() })
})

router.post('/', (req, res) => {
  const { platform, gitlab, github } = req.body
  const config = getConfig()

  if (platform !== undefined) config.platform = platform
  if (gitlab) {
    if (gitlab.instanceUrl) config.gitlab.instanceUrl = gitlab.instanceUrl
    if (gitlab.token !== undefined) config.gitlab.token = gitlab.token
  }
  if (github) {
    if (github.instanceUrl) config.github.instanceUrl = github.instanceUrl
    if (github.token !== undefined) config.github.token = github.token
  }

  saveConfig(config)
  res.json({ success: true, data: config })
})

router.post('/platform', (req, res) => {
  const { platform } = req.body
  const config = getConfig()

  if (platform === 'gitlab' || platform === 'github') {
    config.platform = platform
    saveConfig(config)
    res.json({ success: true, data: config })
  } else {
    res.status(400).json({ success: false, error: 'Invalid platform' })
  }
})

router.post('/test', async (req, res) => {
  const { platform, instanceUrl, token } = req.body

  if (platform === 'github') {
    const isValid = await testGithubConnection(instanceUrl, token)
    res.json({ success: isValid })
  } else {
    const isValid = await testGitlabConnection(instanceUrl, token)
    res.json({ success: isValid })
  }
})

router.post('/repos', async (req, res) => {
  const { platform, idOrPath } = req.body

  if (!idOrPath) {
    res.status(400).json({ success: false, error: 'idOrPath is required' })
    return
  }

  const config = getConfig()
  const platformConfig = platform === 'github' ? config.github : config.gitlab

  if (!platformConfig.instanceUrl || !platformConfig.token) {
    res.status(400).json({ success: false, error: `Please configure ${platform} instance URL and Token first` })
    return
  }

  try {
    let project: any

    if (platform === 'github') {
      const [owner, repo] = idOrPath.split('/')
      if (!owner || !repo) {
        res.status(400).json({ success: false, error: 'Invalid GitHub repository format. Use owner/repo' })
        return
      }
      project = await fetchRepoDetails(platformConfig.instanceUrl, platformConfig.token, owner, repo)
    } else {
      const cleanUrl = platformConfig.instanceUrl.replace(/\/$/, '')
      const response = await fetch(`${cleanUrl}/api/v4/projects/${encodeURIComponent(idOrPath)}`, {
        headers: { 'PRIVATE-TOKEN': platformConfig.token }
      })
      if (!response.ok) throw new Error('Project not found')
      project = await response.json()
    }

    if (platformConfig.repositories.find(r => r.path === project.full_name || r.path === project.path_with_namespace)) {
      res.status(400).json({ success: false, error: 'Repository already exists in whitelist' })
      return
    }

    const newRepo = {
      id: String(project.id),
      name: project.name,
      path: project.full_name || project.path_with_namespace,
      default_branch: project.default_branch || 'main',
      status: '正常' as const
    }

    platformConfig.repositories.push(newRepo)
    saveConfig(config)

    res.json({ success: true, data: newRepo })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message || 'Failed to add repository' })
  }
})

router.delete('/repos/:id', (req, res) => {
  const { platform } = req.query
  const config = getConfig()
  const platformConfig = platform === 'github' ? config.github : config.gitlab

  platformConfig.repositories = platformConfig.repositories.filter(r => String(r.id) !== String(req.params.id))
  saveConfig(config)
  res.json({ success: true })
})

export default router