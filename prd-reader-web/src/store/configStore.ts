import { create } from 'zustand'

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

interface ConfigState {
  config: Config | null
  loading: boolean
  error: string | null
  fetchConfig: () => Promise<void>
  updateConfig: (platform: 'gitlab' | 'github', instanceUrl: string, token: string) => Promise<boolean>
  switchPlatform: (platform: 'gitlab' | 'github') => Promise<boolean>
  testConnection: (platform: 'gitlab' | 'github', instanceUrl: string, token: string) => Promise<boolean>
  addRepository: (platform: 'gitlab' | 'github', idOrPath: string) => Promise<boolean>
  removeRepository: (platform: 'gitlab' | 'github', id: string) => Promise<boolean>
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: null,
  loading: false,
  error: null,

  fetchConfig: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch('/api/config')
      const data = await res.json()
      if (data.success) {
        set({ config: data.data, loading: false })
      } else {
        set({ error: data.error || 'Failed to load config', loading: false })
      }
    } catch (e: any) {
      set({ error: e.message, loading: false })
    }
  },

  updateConfig: async (platform: 'gitlab' | 'github', instanceUrl: string, token: string) => {
    set({ loading: true, error: null })
    try {
      const payload: any = { platform }
      if (platform === 'gitlab') {
        payload.gitlab = { instanceUrl, token }
      } else {
        payload.github = { instanceUrl, token }
      }

      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (data.success) {
        set({ config: data.data, loading: false })
        return true
      } else {
        set({ error: data.error || 'Failed to update config', loading: false })
        return false
      }
    } catch (e: any) {
      set({ error: e.message, loading: false })
      return false
    }
  },

  switchPlatform: async (platform: 'gitlab' | 'github') => {
    try {
      const res = await fetch('/api/config/platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform })
      })
      const data = await res.json()
      if (data.success) {
        set({ config: data.data })
        return true
      }
      return false
    } catch (e) {
      return false
    }
  },

  testConnection: async (platform: 'gitlab' | 'github', instanceUrl: string, token: string) => {
    try {
      const res = await fetch('/api/config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, instanceUrl, token })
      })
      const data = await res.json()
      return data.success
    } catch (e) {
      return false
    }
  },

  addRepository: async (platform: 'gitlab' | 'github', idOrPath: string) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch('/api/config/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, idOrPath })
      })
      const data = await res.json()
      if (data.success) {
        await get().fetchConfig()
        return true
      } else {
        set({ error: data.error || 'Failed to add repo', loading: false })
        return false
      }
    } catch (e: any) {
      set({ error: e.message, loading: false })
      return false
    }
  },

  removeRepository: async (platform: 'gitlab' | 'github', id: string) => {
    try {
      const res = await fetch(`/api/config/repos/${id}?platform=${platform}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        const currentConfig = get().config
        if (currentConfig) {
          const platformConfig = platform === 'github' ? currentConfig.github : currentConfig.gitlab
          set({
            config: {
              ...currentConfig,
              [platform]: {
                ...platformConfig,
                repositories: platformConfig.repositories.filter(r => r.id !== id)
              }
            }
          })
        }
        return true
      }
      return false
    } catch (e) {
      return false
    }
  }
}))