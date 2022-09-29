import * as crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const BUFFER_ENCODING = 'hex'
const DECIPHER_ENCODING = 'binary'
const IV_BYTES = 16
const IV_START = 0
const PLAINTEXT_ENCODING = 'utf8'
const PRIVATE_KEY_BYTES = 32
const TAG_START = IV_BYTES
const TAG_END = 32

export const createPrivateKey = (): string => {
  return crypto.randomBytes(PRIVATE_KEY_BYTES).toString(BUFFER_ENCODING)
}

export const encrypt = (plaintext:string, key: string): string => {
  const iv = crypto.randomBytes(IV_BYTES)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key, BUFFER_ENCODING), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, PLAINTEXT_ENCODING), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString(BUFFER_ENCODING)
}

export const decrypt = (ciphertext: string, key: string): string => {
  const data = Buffer.from(ciphertext, BUFFER_ENCODING)
  const iv = data.slice(IV_START, IV_BYTES)
  const tag = data.slice(TAG_START, TAG_END)
  const text = data.slice(TAG_END) as unknown as string
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key, BUFFER_ENCODING), iv)
  decipher.setAuthTag(tag)
  return decipher.update(text, DECIPHER_ENCODING, PLAINTEXT_ENCODING) + decipher.final(PLAINTEXT_ENCODING)
}
