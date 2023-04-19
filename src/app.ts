import { App, LogLevel } from '@slack/bolt'
import * as dotenv from 'dotenv'
dotenv.config()

export const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  logLevel: LogLevel.INFO,
  customRoutes: [
    {
      path: '/health-check',
      method: ['GET'],
      handler: (req, res) => {
        res.writeHead(200)
        res.end('Health check information displayed here!')
      }
    }
  ]
})
