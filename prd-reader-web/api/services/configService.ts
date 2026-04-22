import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CONFIG_PATH = process.env.CONFIG_PATH || path.join(__dirname, '../../config.json')

export interface Repository {
  id: string
  name: string
  path: string
  default_branch: string
  status: '正常' | '异常'
}

export interface PlatformConfig {
  instanceUrl: string
  token: string
  repositories: Repository[]
}

export interface Config {
  platform: 'gitlab' | 'github'
  gitlab: PlatformConfig
  github: PlatformConfig
}

const defaultConfig: Config = {
  platform: 'gitlab',
  gitlab: {
    instanceUrl: 'https://gitlab.com',
    token: '',
    repositories: []
  },
  github: {
    instanceUrl: 'https://github.com',
    token: '',
    repositories: []
  }
}

interface LegacyConfig {
  instanceUrl: string
  token: string
  repositories: Repository[]
}

const isLegacyConfig = (config: any): config is LegacyConfig => {
  return config && 'instanceUrl' in config && 'token' in config && 'repositories' in config && !('platform' in config)
}

export const getConfig = (): Config => {
  let config: Config = { ...defaultConfig }
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf-8')
      const parsed = JSON.parse(data)

      if (isLegacyConfig(parsed)) {
        const migrated: Config = {
          platform: 'gitlab',
          gitlab: {
            instanceUrl: parsed.instanceUrl,
            token: parsed.token,
            repositories: parsed.repositories
          },
          github: {
            instanceUrl: 'https://github.com',
            token: '',
            repositories: []
          }
        }
        saveConfig(migrated)
        config = migrated
      } else {
        config = parsed
      }
    }
  } catch (e) {
    console.error('Failed to read config', e)
  }

  // Fallback to environment variables if not configured
  if (!config.gitlab.token && process.env.GITLAB_TOKEN) {
    config.gitlab.token = process.env.GITLAB_TOKEN
  }
  if (process.env.GITLAB_INSTANCE_URL) {
    config.gitlab.instanceUrl = process.env.GITLAB_INSTANCE_URL
  }
  if (!config.github.token && process.env.GITHUB_TOKEN) {
    config.github.token = process.env.GITHUB_TOKEN
  }
  if (process.env.DEFAULT_PLATFORM && (process.env.DEFAULT_PLATFORM === 'github' || process.env.DEFAULT_PLATFORM === 'gitlab')) {
    config.platform = process.env.DEFAULT_PLATFORM as 'github' | 'gitlab'
  }

  return config
}

export const saveConfig = (config: Config): void => {
  try {
    const dir = path.dirname(CONFIG_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8')
  } catch (e) {
    console.error('Failed to save config', e)
  }
}