import { createPrivateKey, decrypt, encrypt } from 'src/crypto'
import { v4 as uuidv4 } from 'uuid'

// Simulated API keys
export const API_KEY_1 = 'API-KEY-1'
export const API_KEY_2 = 'API-KEY-2'

// Simulated storage of API keys mapped to private keys
const API_KEY_MAP: Map<string, string> = new Map([
  [API_KEY_1, createPrivateKey()],
  [API_KEY_2, createPrivateKey()],
])

// Simulated storage of API keys mapped to tokens and encrypted secrets
const API_TOKEN_MAP: Map<string, Map<string, string>> = new Map()
API_TOKEN_MAP.set(API_KEY_1, new Map())
API_TOKEN_MAP.set(API_KEY_2, new Map())

const TOKEN_PREFIX = 'dp.token.'

export const getPrivateKey = (apiKey: string): Promise<string | undefined> => {
  return Promise.resolve(API_KEY_MAP.get(apiKey))
}

export const getTokenSecretMap = (apiKey: string): Promise<Map<string, string> | undefined> => {
  return Promise.resolve(API_TOKEN_MAP.get(apiKey))
}

export const getSecrets = (tokenSecretMap: Map<string, string>, requestedTokens: string[], privateKey: string): Promise<string[]> => {
  const secrets: string[] = []

  for (const requestedToken of requestedTokens) {
    const secret = tokenSecretMap.get(requestedToken)

    if (secret) {
      secrets.push(decrypt(secret, privateKey))
    }
  }

  return Promise.resolve(secrets)
}

export const insertSecret = (tokenSecretMap: Map<string, string>, secret: string, privateKey: string): Promise<string> => {
  const token = `${TOKEN_PREFIX}${uuidv4().replace(/-/g, '')}`
  tokenSecretMap.set(token, encrypt(secret, privateKey))
  return Promise.resolve(token)
}

export const updateSecret = (token: string, tokenSecretMap: Map<string, string>, secret: string, privateKey: string): Promise<void> => {
  tokenSecretMap.set(token, encrypt(secret, privateKey))
  return Promise.resolve()
}

export const deleteSecret = (tokenSecretMap: Map<string, string>, token: string): Promise<void> => {
  tokenSecretMap.delete(token)
  return Promise.resolve()
}
