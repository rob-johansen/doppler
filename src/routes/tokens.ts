import express, { Response } from 'express'

import {
  deleteSecret,
  getSecrets,
  insertSecret,
  updateSecret
} from 'src/store'
import type {
  DeleteTokenRequest,
  GetTokensRequest,
  GetTokensResponseBody,
  PostTokenRequest,
  PutTokenRequest
} from 'src/types'

const GET_TOKENS_LIMIT = 2

const router = express.Router()

router.get('/', async (req: GetTokensRequest, res: Response): Promise<void> => {
  if (!req.query.t) {
    res.status(400).send('Bad Request')
    return
  }

  const tokens = req.query.t.split(',', GET_TOKENS_LIMIT)
  const response: GetTokensResponseBody = {}

  for (const token of tokens) {
    if (token.length === 0) {
      res.status(400).send('Bad Request')
      return
    }
  }

  const { privateKey, tokenSecretMap } = req.context

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

router.post('/', async (req: PostTokenRequest, res: Response): Promise<void> => {
  if (!req.body.secret) {
    res.status(400).send('Bad Request')
    return
  }

  const { privateKey, tokenSecretMap } = req.context

  try {
    const token = await insertSecret(tokenSecretMap, req.body.secret, privateKey)
    res.status(201).send({ token })
  } catch (err) {
    res.status(500).send('Internal Server Error')
  }
})

router.put('/:token', async (req: PutTokenRequest, res: Response): Promise<void> => {
  if (!req.body.secret) {
    res.status(400).send('Bad Request')
    return
  }

  const { privateKey, tokenSecretMap } = req.context
  const { token } = req.params

  try {
    const [secret] = await getSecrets(tokenSecretMap, [token], privateKey)
    if (!secret) {
      res.status(400).send('Bad Request')
      return
    }

    await updateSecret(token, tokenSecretMap, req.body.secret, privateKey)
    res.status(204).end()
  } catch (err) {
    res.status(500).send('Internal Server Error')
  }
})

router.delete('/:token', async (req: DeleteTokenRequest, res: Response): Promise<void> => {
  try {
    await deleteSecret(req.context.tokenSecretMap, req.params.token)
    res.status(204).end()
  } catch (err) {
    res.status(500).send('Internal Server Error')
  }
})

export default router
