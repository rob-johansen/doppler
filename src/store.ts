import { createPrivateKey, decrypt, encrypt } from 'src/crypto'
import { v4 as uuidv4 } from 'uuid'

// Simulated storage of API keys mapped to private keys
const API_KEY_MAP: Map<string, string> = new Map([['DEV-API-KEY', createPrivateKey()]])

// Simulated storage of tokens mapped to encrypted secrets
const TOKEN_SECRET_MAP: Map<string, string> = new Map()

export const getPrivateKey = (apiKey: string): Promise<string | undefined> => {
  return Promise.resolve(API_KEY_MAP.get(apiKey))
}

export const getSecrets = (requestedTokens: string[], privateKey: string): Promise<string[]> => {
  const secrets: string[] = []

  for (const requestedToken of requestedTokens) {
    const secret = TOKEN_SECRET_MAP.get(requestedToken)

    if (secret) {
      secrets.push(decrypt(secret, privateKey))
    }
  }

  return Promise.resolve(secrets)
}

export const insertSecret = (secret: string, privateKey: string): Promise<string> => {
  const token = uuidv4().replace(/-/g, '')
  TOKEN_SECRET_MAP.set(token, encrypt(secret, privateKey))
  return Promise.resolve(token)
}
