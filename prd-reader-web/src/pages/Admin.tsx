import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Settings2, Key, Eye, EyeOff, Save, ShieldCheck, Plus, Check, Trash2 } from 'lucide-react'
import { useConfigStore } from '@/store/configStore'

type PlatformKey = 'gitlab' | 'github'
type DraftState = Record<PlatformKey, { instanceUrl: string; token: string; repoInput: string }>
type ConnectionState = Record<PlatformKey, 'idle' | 'testing' | 'success' | 'error'>

export default function Admin() {
  const navigate = useNavigate()
  const { config, fetchConfig, updateConfig, switchPlatform, testConnection, addRepository, removeRepository, loading } = useConfigStore()

  const [activeTab, setActiveTab] = useState<PlatformKey>('gitlab')
  const [drafts, setDrafts] = useState<DraftState>({
    gitlab: { instanceUrl: '', token: '', repoInput: '' },
    github: { instanceUrl: '', token: '', repoInput: '' }
  })
  const [showToken, setShowToken] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>({
    gitlab: 'idle',
    github: 'idle'
  })
  const [connectionMessage, setConnectionMessage] = useState<Record<PlatformKey, string>>({
    gitlab: '',
    github: ''
  })

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  useEffect(() => {
    if (config) {
      setActiveTab(config.platform)
      setDrafts(prev => ({
        gitlab: {
          instanceUrl: config.gitlab.instanceUrl,
          token: config.gitlab.token,
          repoInput: prev.gitlab.repoInput
        },
        github: {
          instanceUrl: config.github.instanceUrl,
          token: config.github.token,
          repoInput: prev.github.repoInput
        }
      }))
      setConnectionStatus({
        gitlab: 'idle',
        github: 'idle'
      })
    }
  }, [config])

  const currentDraft = drafts[activeTab]
  const currentConnectionStatus = connectionStatus[activeTab]
  const currentConnectionMessage = connectionMessage[activeTab]

  const updateDraft = (platform: PlatformKey, patch: Partial<DraftState[PlatformKey]>) => {
    setDrafts(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        ...patch
      }
    }))
  }

  const handleTabChange = async (tab: PlatformKey) => {
    if (tab === activeTab) return
    setActiveTab(tab)
    setShowToken(false)
    setConnectionStatus(prev => ({ ...prev, [tab]: 'idle' }))
    await switchPlatform(tab)
  }

  const handleSaveConfig = async () => {
    const success = await updateConfig(activeTab, currentDraft.instanceUrl, currentDraft.token)
    if (success) {
      setConnectionStatus(prev => ({ ...prev, [activeTab]: 'idle' }))
      alert('配置保存成功！')
    } else {
      alert(useConfigStore.getState().error || '配置保存失败')
    }
  }

  const handleTestConnection = async () => {
    setConnectionStatus(prev => ({ ...prev, [activeTab]: 'testing' }))
    setConnectionMessage(prev => ({ ...prev, [activeTab]: '' }))

    const success = await testConnection(activeTab, currentDraft.instanceUrl, currentDraft.token)
    const message = success ? '' : (useConfigStore.getState().error || '连接失败，请检查实例地址、网络和 Token')

    setConnectionStatus(prev => ({ ...prev, [activeTab]: success ? 'success' : 'error' }))
    setConnectionMessage(prev => ({ ...prev, [activeTab]: message }))
  }

  const handleAddRepo = async () => {
    if (!currentDraft.repoInput.trim()) return
    const success = await addRepository(activeTab, currentDraft.repoInput.trim())
    if (success) {
      updateDraft(activeTab, { repoInput: '' })
    } else {
      alert(useConfigStore.getState().error || '添加失败')
    }
  }

  const getStatusDisplay = () => {
    switch (currentConnectionStatus) {
      case 'testing': return <div className="text-blue-500 font-bold text-sm">测试中...</div>
      case 'success': return <div className="bg-white px-4 py-2 rounded-full shadow-sm flex items-center gap-2 text-sm font-bold text-[#10B981] border border-[#10B981]/20"><div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></div>已连接</div>
      case 'error': return <div className="text-red-500 font-bold text-sm">连接失败</div>
      default: return null
    }
  }

  const currentPlatformConfig = config?.[activeTab]
  const repositories = currentPlatformConfig?.repositories || []

  return (
    <div className="flex h-screen w-screen p-3 gap-3">
      <main className="flex-1 flex flex-col relative bg-white rounded-[32px] card-shadow overflow-hidden border-4 border-[var(--bg-pastel)]">

        <header className="h-20 flex items-center justify-between px-10 border-b border-gray-50 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center text-[#9CA3AF] hover:bg-[var(--accent-blue)] hover:text-white transition-all">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="font-['Quicksand'] font-bold text-xl text-[#4A4E69]">后台配置</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12">
          <div className="max-w-4xl mx-auto space-y-10">

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[var(--accent-yellow)] rounded-[20px] flex items-center justify-center mx-auto mb-4 transform rotate-12 shadow-sm">
                <Settings2 className="w-8 h-8 text-white" />
              </div>
              <h1 className="font-['Quicksand'] text-3xl font-bold text-[#4A4E69] mb-2">系统配置中心</h1>
              <p className="text-[#9CA3AF] font-semibold">管理您的代码托管平台连接和可见仓库白名单。</p>
            </div>

            <div className="flex justify-center gap-2 mb-8">
              <button
                onClick={() => handleTabChange('gitlab')}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
                  activeTab === 'gitlab'
                    ? 'bg-[#A2D2FF] text-white shadow-md'
                    : 'bg-[#F3F4F6] text-[#9CA3AF] hover:bg-[#E5E7EB]'
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z"/>
                </svg>
                GitLab
              </button>
              <button
                onClick={() => handleTabChange('github')}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
                  activeTab === 'github'
                    ? 'bg-[#24292f] text-white shadow-md'
                    : 'bg-[#F3F4F6] text-[#9CA3AF] hover:bg-[#E5E7EB]'
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </button>
            </div>

            <section className="bg-white border-2 border-[#F3F4F6] rounded-[24px] overflow-hidden hover:border-[var(--accent-blue)] transition-colors duration-300">
              <div className="px-8 py-6 border-b-2 border-[#F3F4F6] bg-[#F9FAFB] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <Key className="w-6 h-6 text-[var(--accent-pink)]" />
                  </div>
                  <div>
                    <h2 className="font-['Quicksand'] text-xl font-bold text-[#4A4E69]">
                      {activeTab === 'gitlab' ? 'GitLab' : 'GitHub'} 访问令牌
                    </h2>
                    <p className="text-sm text-[#9CA3AF] mt-1 font-semibold">
                      用于全局拉取仓库文件。需要 <code className="bg-gray-100 px-1 py-0.5 rounded text-pink-600 font-mono">{activeTab === 'gitlab' ? 'read_api' : 'public_repo + repo'}</code> 权限。
                    </p>
                  </div>
                </div>
                {getStatusDisplay()}
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-[#6B7280] mb-2 pl-2">
                    {activeTab === 'gitlab' ? 'GitLab' : 'GitHub'} 实例地址
                  </label>
                  <input
                    type="text"
                    value={currentDraft.instanceUrl}
                    onChange={e => updateDraft(activeTab, { instanceUrl: e.target.value })}
                    placeholder={activeTab === 'gitlab' ? 'https://gitlab.com' : 'https://github.com'}
                    className="soft-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#6B7280] mb-2 pl-2">个人/项目访问令牌 (Token)</label>
                  <div className="relative">
                    <input
                      type={showToken ? "text" : "password"}
                      value={currentDraft.token}
                      onChange={e => updateDraft(activeTab, { token: e.target.value })}
                      className="soft-input font-mono"
                    />
                    <button
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[var(--accent-blue)] transition-colors"
                    >
                      {showToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-4">
                  <button onClick={handleTestConnection} disabled={loading} className="soft-btn soft-btn-outline">
                    测试连接
                  </button>
                  <button onClick={handleSaveConfig} disabled={loading} className="soft-btn">
                    <Save className="w-4 h-4" />
                    保存配置
                  </button>
                </div>
                {currentConnectionStatus === 'error' && currentConnectionMessage && (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-500">
                    {currentConnectionMessage}
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white border-2 border-[#F3F4F6] rounded-[24px] overflow-hidden hover:border-[var(--accent-blue)] transition-colors duration-300">
              <div className="px-8 py-6 border-b-2 border-[#F3F4F6] bg-[#F9FAFB] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <ShieldCheck className="w-6 h-6 text-[var(--accent-blue)]" />
                  </div>
                  <div>
                    <h2 className="font-['Quicksand'] text-xl font-bold text-[#4A4E69]">仓库白名单</h2>
                    <p className="text-sm text-[#9CA3AF] mt-1 font-semibold">只有添加到这里的仓库才会展示给前端用户。</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  activeTab === 'github' ? 'bg-[#24292f] text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {activeTab === 'gitlab' ? 'GitLab' : 'GitHub'}
                </span>
              </div>

              <div className="p-8">
                <div className="flex items-end gap-4 mb-8">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-[#6B7280] mb-2 pl-2">添加仓库 {activeTab === 'gitlab' ? '(ID 或 路径)' : '(owner/repo)'}</label>
                    <input
                      type="text"
                      placeholder={activeTab === 'gitlab' ? '例如: 12345 或 group/project' : '例如: owner/repository'}
                      className="soft-input"
                      value={currentDraft.repoInput}
                      onChange={e => updateDraft(activeTab, { repoInput: e.target.value })}
                      onKeyDown={e => e.key === 'Enter' && handleAddRepo()}
                    />
                  </div>
                  <button onClick={handleAddRepo} disabled={loading} className="soft-btn h-[44px]">
                    <Plus className="w-4 h-4" />
                    添加仓库
                  </button>
                </div>

                <div className="space-y-3">
                  {repositories.map(repo => (
                    <div key={repo.id} className="bg-[#F9FAFB] border-2 border-transparent hover:border-[#E5E7EB] rounded-[20px] p-4 flex items-center justify-between transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#9CA3AF] font-bold">
                          {repo.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-[#4A4E69]">{repo.name}</div>
                          <div className="text-xs text-[#9CA3AF] font-mono mt-0.5">{repo.path}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${repo.status === '正常' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-red-100 text-red-500'}`}>
                          {repo.status === '正常' ? <Check className="w-3 h-3" /> : null} {repo.status}
                        </span>
                        <button
                          onClick={() => removeRepository(activeTab, repo.id)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[#9CA3AF] hover:bg-[#FEE2E2] hover:text-[#EF4444] transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {repositories.length === 0 && (
                    <div className="text-center py-8 text-gray-400 font-semibold">
                      暂无仓库白名单，请输入后添加。
                    </div>
                  )}
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  )
}
