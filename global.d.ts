declare global {
  namespace Express {
    export interface Request {
      context: {
        privateKey: string
        tokenSecretMap: Map<string, string>
      }
    }
  }
}

export {}
