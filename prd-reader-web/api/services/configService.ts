import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DEFAULT_CONFIG_PATH = path.join(__dirname, '../../config.json')
const CONFIG_PATH = process.env.CONFIG_PATH ? path.resolve(process.env.CONFIG_PATH) : DEFAULT_CONFIG_PATH

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

const getReadableConfigPath = () => {
  if (fs.existsSync(CONFIG_PATH)) {
    return CONFIG_PATH
  }

  if (CONFIG_PATH !== DEFAULT_CONFIG_PATH && fs.existsSync(DEFAULT_CONFIG_PATH)) {
    return DEFAULT_CONFIG_PATH
  }

  return CONFIG_PATH
}

export const getConfig = (): Config => {
  let config: Config = { ...defaultConfig }
  try {
    const readableConfigPath = getReadableConfigPath()

    if (fs.existsSync(readableConfigPath)) {
      const data = fs.readFileSync(readableConfigPath, 'utf-8')
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
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true })
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8')
  } catch (e) {
    console.error('Failed to save config', e)
    throw e
  }
}
