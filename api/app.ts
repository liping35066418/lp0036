import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import accountRoutes from './routes/accounts.js'
import postRoutes from './routes/posts.js'
import liveRoutes from './routes/live.js'
import platformRoutes from './routes/platforms.js'
import dashboardRoutes from './routes/dashboards.js'
import reportRoutes from './routes/reports.js'
import { db, initDatabase } from './db/database.js'
import { initMockData } from './services/dataGenerator.js'
import { initScheduledReports } from './routes/reports.js'
import { optimizeForLargeData, cleanPostsData, cleanAccountData, deduplicateRecords } from './services/dataProcessor.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

initDatabase()
initMockData()
initScheduledReports()

try {
  optimizeForLargeData()
  cleanPostsData()
  cleanAccountData()
  deduplicateRecords()
  console.log('Data optimization and cleaning completed')
} catch (e) {
  console.warn('Data optimization skipped:', e)
}

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/accounts', accountRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/live', liveRoutes)
app.use('/api/platforms', platformRoutes)
app.use('/api/dashboards', dashboardRoutes)
app.use('/api/reports', reportRoutes)

app.get(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
      version: '1.0.0',
    })
  },
)

app.get('/api/stats/overview', (req: Request, res: Response) => {
  try {
    const accountsCount = db.prepare('SELECT COUNT(*) as count FROM accounts').get() as any
    const postsCount = db.prepare('SELECT COUNT(*) as count FROM posts').get() as any
    const platformsCount = db.prepare('SELECT COUNT(*) as count FROM platforms').get() as any
    const liveCount = db.prepare("SELECT COUNT(*) as count FROM live_rooms WHERE status = 'living'").get() as any

    const totalPlays = db.prepare('SELECT COALESCE(SUM(play_count), 0) as total FROM posts').get() as any
    const totalLikes = db.prepare('SELECT COALESCE(SUM(like_count), 0) as total FROM posts').get() as any
    const totalComments = db.prepare('SELECT COALESCE(SUM(comment_count), 0) as total FROM posts').get() as any
    const totalShares = db.prepare('SELECT COALESCE(SUM(share_count), 0) as total FROM posts').get() as any
    const totalFollowers = db.prepare('SELECT COALESCE(SUM(followers_count), 0) as total FROM accounts').get() as any

    res.json({
      success: true,
      data: {
        overview: {
          total_accounts: accountsCount.count,
          total_posts: postsCount.count,
          total_platforms: platformsCount.count,
          living_rooms: liveCount.count,
        },
        metrics: {
          total_plays: totalPlays.total,
          total_likes: totalLikes.total,
          total_comments: totalComments.total,
          total_shares: totalShares.total,
          total_followers: totalFollowers.total,
        },
      },
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', error)
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
