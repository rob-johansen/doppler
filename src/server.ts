import express from 'express'
import rateLimit from 'express-rate-limit'

import { getPrivateKey, getTokenSecretMap } from 'src/store'
import tokenRoutes from './routes/tokens'

const RATE_LIMIT_MAX_REQUESTS = 10
const RATE_LIMIT_WINDOW_MS = 1000 * 60

const doppler = express()
doppler.disable('x-powered-by')
doppler.use(express.json())

// Denial of service attacks are a threat vector. Although this
// middleware for rate limiting is rudimentary and unrealistic,
// it's the spirit that counts in a take-home assignment! :)
doppler.use(rateLimit({
  max: RATE_LIMIT_MAX_REQUESTS,
  windowMs: RATE_LIMIT_WINDOW_MS
}))

// This middleware for adding the requester's private key and
// token <=> secret map to the request context eliminates a
// fair amount of boilerplate from the route handlers.
doppler.use(async (req, res, next): Promise<void> => {
  const apiKey: string | undefined = req.header('Authorization')?.split(' ')?.[1]
  if (!apiKey) {
    res.status(400).send('Bad Request')
    return
  }

  const privateKey: string | undefined = await getPrivateKey(apiKey)
  if (!privateKey) {
    res.status(400).send('Bad Request')
    return
  }

  const tokenSecretMap: Map<string, string> | undefined = await getTokenSecretMap(apiKey)
  if (!tokenSecretMap) {
    res.status(400).send('Bad Request')
    return
  }

  req.context = {
    privateKey,
    tokenSecretMap
  }

  next()
})

doppler.use('/tokens', tokenRoutes)

export default doppler
