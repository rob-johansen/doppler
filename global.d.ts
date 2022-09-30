import { RequestContext } from 'src/types'

declare global {
  namespace Express {
    export interface Request {
      context: RequestContext
      rateLimit: {
        current: number
        limit: number
        remaining: number
        resetTime?: Date
      }
    }
  }
}

export {}
