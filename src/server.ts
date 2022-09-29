import express, { Request } from 'express'

import { deleteSecret, getPrivateKey, getSecrets, getTokenSecretMap, insertSecret } from 'src/store'
import type CreateTokenResponse from 'src/types/CreateTokenResponse' // These should all be renamed to ...Body
import type GetTokensRequest from 'src/types/GetTokensRequest'
import type GetTokensResponse from 'src/types/GetTokensResponse'
import type CreateTokenRequest from 'src/types/CreateTokenRequest'
const GET_TOKENS_LIMIT = 2

const doppler = express()
doppler.disable('x-powered-by')
doppler.use(express.json())
const port = 3000

doppler.get('/tokens', async (req: Request<{}, GetTokensResponse | string, {}, GetTokensRequest>, res): Promise<void> => {
  if (!req.query.t) {
    res.status(400).send('Bad Request')
    return
  }

  const tokens = req.query.t.split(',', GET_TOKENS_LIMIT)
  const response: GetTokensResponse = {}

  for (const token of tokens) {
    if (token.length === 0) {
      res.status(400).send('Bad Request')
      return
    }
  }

  const tokenSecretMap: Map<string, string> | undefined = await getTokenSecretMap('DEV-API-KEY')
  if (!tokenSecretMap) {
    res.status(400).send('Bad Request')
    return
  }

  const privateKey: string | undefined = await getPrivateKey('DEV-API-KEY')
  if (!privateKey) {
    res.status(400).send('Bad Request')
    return
  }

  try {
    const secrets: string[] = await getSecrets(tokenSecretMap, tokens, privateKey)

    if (secrets.length !== tokens.length) {
      res.status(400).send('Bad Request')
      return
    }

    for (let i = 0; i < secrets.length; i++) {
      response[tokens[i]] = secrets[i]
    }

    res.send(response)
  } catch (err) {
    res.status(500).send('Internal Server Error')
  }
})

doppler.post('/tokens', async (req: Request<{}, CreateTokenResponse | string, CreateTokenRequest, {}>, res): Promise<void> => {
  if (!req.body.secret) {
    res.status(400).send('Bad Request')
    return
  }

  const tokenSecretMap: Map<string, string> | undefined = await getTokenSecretMap('DEV-API-KEY')
  if (!tokenSecretMap) {
    res.status(400).send('Bad Request')
    return
  }

  const privateKey: string | undefined = await getPrivateKey('DEV-API-KEY')
  if (!privateKey) {
    res.status(400).send('Bad Request')
    return
  }

  try {
    const token = await insertSecret(tokenSecretMap, req.body.secret, privateKey)
    res.status(201).send({ token })
  } catch (err) {
    res.status(500).send('Internal Server Error')
  }
})

doppler.put('/tokens/:token', async (req: Request<CreateTokenResponse, CreateTokenResponse | string, CreateTokenRequest, {}>, res): Promise<void> => {
  // TODO .... Come back to this when you get a response from Matte.
  if (!req.body.secret) {
    res.status(400).send('Bad Request')
    return
  }

  const tokenSecretMap: Map<string, string> | undefined = await getTokenSecretMap('DEV-API-KEY')
  if (!tokenSecretMap) {
    res.status(400).send('Bad Request')
    return
  }

  const privateKey: string | undefined = await getPrivateKey('DEV-API-KEY')
  if (!privateKey) {
    res.status(400).send('Bad Request')
    return
  }

  try {
    const [secret] = await getSecrets(tokenSecretMap, [req.params.token], privateKey)
    if (!secret) {
      res.status(400).send('Bad Request')
      return
    }

    // TODO ....
  } catch (err) {
    // TODO ....
  }
})

doppler.delete('/tokens/:token', async (req: Request<CreateTokenResponse>, res) => {
  const tokenSecretMap: Map<string, string> | undefined = await getTokenSecretMap('DEV-API-KEY')
  if (!tokenSecretMap) {
    res.status(400).send('Bad Request')
    return
  }

  try {
    await deleteSecret(tokenSecretMap, req.params.token)
    res.status(204).end()
  } catch (err) {
    res.status(500).send('Internal Server Error')
  }
})

doppler.listen(port, () => {
  console.log(`Doppler listening on port ${port}`)
})
