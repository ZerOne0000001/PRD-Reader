import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { setGlobalDispatcher, EnvHttpProxyAgent } from 'undici'
import authRoutes from './routes/auth.js'
import configRoutes from './routes/config.js'
import gitlabRoutes from './routes/gitlab.js'
import githubRoutes from './routes/github.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

// Support proxy for global fetch and respect NO_PROXY
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.https_proxy || process.env.http_proxy
if (proxyUrl) {
  try {
    // 自动为内网 IP 和 localhost 添加 NO_PROXY，防止代理拦截内网 GitLab 请求
    const defaultNoProxy = 'localhost,127.0.0.1,::1,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16'
    if (!process.env.NO_PROXY && !process.env.no_proxy) {
      process.env.NO_PROXY = defaultNoProxy
    } else {
      process.env.NO_PROXY = `${process.env.NO_PROXY || process.env.no_proxy},${defaultNoProxy}`
    }

    const envProxy = new EnvHttpProxyAgent()
    setGlobalDispatcher(envProxy)
    console.log(`[Proxy] Global fetch enabled EnvHttpProxyAgent (respects HTTP_PROXY & NO_PROXY)`)
  } catch (e) {
    console.error(`[Proxy] Failed to set proxy: ${e}`)
  }
}

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/config', configRoutes)
app.use('/api/gitlab', gitlabRoutes)
app.use('/api/github', githubRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: error.message || 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app