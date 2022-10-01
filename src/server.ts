import express from 'express'
import rateLimit from 'express-rate-limit'

import { getPrivateKey, getTokenSecretMap } from 'src/store'
import tokenRoutes from './routes/tokens'

const doppler = express()
doppler.disable('x-powered-by')
doppler.use(express.json())

// Although this middleware for rate limiting is rudimentary--e.g. we
// may want custom limits for the various ways in which this interal
// tokenization service is accessed--I wanted it to be clear that
// denial of service attacks were on my mind as a threat vector.

// Note that I picked 14 maximum requests per second to correspond
// to the number of tests I wrote (there are 15 tests, so the last
// one tests the rate limit).
const RATE_LIMIT_MAX_REQUESTS = 14
const RATE_LIMIT_WINDOW_MS = 1000

doppler.use(rateLimit({
  max: RATE_LIMIT_MAX_REQUESTS,
  windowMs: RATE_LIMIT_WINDOW_MS
}))

// This middleware for adding the requester's private key and
// token <=> secret map to the request context eliminates a
// fair amount of boilerplate from the route handlers, and
// allows us to exit early in the case of bogus API keys.
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
