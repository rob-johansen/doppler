declare global {
  namespace Express {
    export interface Request {
      context: {
        privateKey: string
        tokenSecretMap: Map<string, string>
      }
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
