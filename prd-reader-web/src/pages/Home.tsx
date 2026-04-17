import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Settings, GitBranch, ArrowRight } from 'lucide-react'
import { useConfigStore } from '@/store/configStore'

export default function Home() {
  const navigate = useNavigate()
  const { config, fetchConfig, loading } = useConfigStore()

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const platformConfig = config?.platform === 'github' ? config?.github : config?.gitlab
  const whitelistRepos = platformConfig?.repositories || []

  // Helper to generate a consistent color for avatars
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-[var(--accent-blue)] text-white', 
      'bg-[var(--accent-pink)] text-white', 
      'bg-[#BDE0FE] text-white', 
      'bg-[#FDF1D6] text-[#D4A373]', 
      'bg-[#E2E8F0] text-[#4F46E5]'
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <div className="min-h-screen bg-[var(--bg-pastel)] text-[var(--text-dark)] font-['Nunito'] flex flex-col items-center overflow-x-hidden relative">
      {/* Settings Entry */}
      <button 
        onClick={() => navigate('/admin')}
        className="absolute top-8 right-8 flex items-center justify-center w-12 h-12 bg-white rounded-full text-[#4A4E69] shadow-[0_4px_12px_rgba(74,78,105,0.05)] transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(162,210,255,0.4)] hover:text-[var(--accent-blue)] z-50 group"
        title="后台设置"
      >
        <Settings className="w-6 h-6 transition-transform duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-45" />
      </button>

      <main className="w-full max-w-[1200px] px-8 pt-[5vh] pb-16 flex flex-col gap-16 animate-in fade-in slide-in-from-bottom-8 duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
        
        {/* Header Area */}
        <header className="text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[var(--accent-blue)] mb-4 shadow-[0_8px_24px_rgba(162,210,255,0.4)]">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="font-['Quicksand'] text-4xl font-bold text-[#4A4E69] relative inline-block z-10">
            PRD-Reader
            <span className="absolute bottom-1 -left-1 -right-1 h-3 bg-yellow-300/60 -z-10 rounded-full -rotate-1"></span>
          </h1>
          <p className="text-lg text-[#4A4E69] opacity-80 font-medium">请选择要阅读的工作区 ✿</p>
        </header>

        {/* Grid Area */}
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="w-10 h-10 border-4 border-white border-t-[var(--accent-blue)] rounded-full animate-spin"></div>
          </div>
        ) : whitelistRepos.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-8 text-[#9CA3AF]">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm">
              <BookOpen className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-[#4A4E69] mb-2">暂无可用工作区</h2>
            <p className="font-medium text-center">管理员尚未配置任何白名单仓库，<br/>请点击右上角进入后台配置。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 w-full">
            {whitelistRepos.map((repo, idx) => (
              <div 
                key={repo.id}
                onClick={() => navigate(`/?repo=${encodeURIComponent(repo.id)}`)}
                className="bg-white rounded-2xl p-8 flex flex-col gap-4 cursor-pointer relative transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-[0_4px_12px_rgba(74,78,105,0.05)] border-2 border-transparent hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_16px_32px_rgba(162,210,255,0.6)] hover:border-[var(--accent-blue)] group"
                style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center font-['Quicksand'] font-bold text-xl shrink-0 ${getAvatarColor(repo.name)}`}>
                    {repo.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <h2 className="font-['Quicksand'] text-lg font-bold text-[#4A4E69] whitespace-nowrap overflow-hidden text-ellipsis">
                      {repo.name}
                    </h2>
                    <span className="text-xs text-[#9CA3AF] font-mono whitespace-nowrap overflow-hidden text-ellipsis">
                      {repo.path}
                    </span>
                  </div>
                </div>
                
                <div className="inline-flex items-center gap-1.5 text-xs text-[#4A4E69] bg-[var(--bg-pastel)] px-2.5 py-1 rounded-full mt-2 self-start font-semibold">
                  <GitBranch className="w-3.5 h-3.5" /> 
                  {repo.default_branch}
                </div>

                <ArrowRight className="absolute top-8 right-8 text-[var(--accent-blue)] w-5 h-5 opacity-0 -translate-x-2 transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:opacity-100 group-hover:translate-x-0" />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
