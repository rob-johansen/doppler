import { expect } from 'expect'
import request from 'supertest'

import {
  API_KEY_1,
  API_KEY_2,
  getPrivateKey,
  getTokenSecretMap,
  insertSecret
} from 'src/store'
import { decrypt } from 'src/crypto'
import type { RequestContext } from 'src/types'
import doppler from 'src/server'

const getContext = async (apiKey: string): Promise<RequestContext> => {
  const privateKey = await getPrivateKey(apiKey)
  const tokenSecretMap = await getTokenSecretMap(apiKey)

  if (!privateKey || !tokenSecretMap) {
    throw new Error('Error getting request context in tests')
  }

  return { privateKey, tokenSecretMap }
}

describe('GET /tokens', () => {
  describe('when there is no `t` query parameter', () => {
    it('should return 400', async () => {
      const response = await request(doppler)
        .get('/tokens')
        .set('Authorization', `Bearer ${API_KEY_1}`)
      expect(response.statusCode).toEqual(400)
    })
  })

  describe('when the `t` query parameter is malformed', () => {
    it('should return 400', async () => {
      const response = await request(doppler)
        .get('/tokens?t=,abc,def')
        .set('Authorization', `Bearer ${API_KEY_1}`)
      expect(response.statusCode).toEqual(400)
    })
  })

  describe('when too many tokens are requested', () => {
    it('should return 400', async () => {
      const response = await request(doppler)
        .get('/tokens?t=ab,cd,ef')
        .set('Authorization', `Bearer ${API_KEY_1}`)
      expect(response.statusCode).toEqual(400)
    })
  })

  describe('when no secrets match one or more requested tokens', () => {
    let goodToken = ''
    let badToken = 'bogus'

    beforeEach(async () => {
      const { privateKey, tokenSecretMap } = await getContext(API_KEY_1)
      goodToken = await insertSecret(tokenSecretMap, 'password', privateKey)
    })

    it('should return 400', async () => {
      const response = await request(doppler)
        .get(`/tokens?t=${goodToken},${badToken}`)
        .set('Authorization', `Bearer ${API_KEY_1}`)
      expect(response.statusCode).toEqual(400)
    })
  })

  describe('when an existing token is requested with an invalid API key', () => {
    let token = ''

    beforeEach(async () => {
      const { privateKey, tokenSecretMap } = await getContext(API_KEY_1)
      token = await insertSecret(tokenSecretMap, 'password', privateKey)
    })

    it('should return 400', async () => {
      const response = await request(doppler)
        .get(`/tokens?t=${token}`)
        .set('Authorization', `Bearer ${API_KEY_2}`)
      expect(response.statusCode).toEqual(400)
    })
  })

  describe('when an existing token is requested with a valid API key', () => {
    let token = ''
    let secret = 'password'

    beforeEach(async () => {
      const { privateKey, tokenSecretMap } = await getContext(API_KEY_1)
      token = await insertSecret(tokenSecretMap, secret, privateKey)
    })

    it('should return 200 and the token/secret', async () => {
      const response = await request(doppler)
        .get(`/tokens?t=${token}`)
        .set('Authorization', `Bearer ${API_KEY_1}`)
      expect(response.statusCode).toEqual(200)
      expect(response.body[token]).toEqual(secret)
    })
  })

  describe('when two existing tokens are requested with a valid API key', () => {
    let token1 = ''
    let token2 = ''
    let secret1 = 'password1'
    let secret2 = 'password2'

    beforeEach(async () => {
      const { privateKey, tokenSecretMap } = await getContext(API_KEY_1)
      token1 = await insertSecret(tokenSecretMap, secret1, privateKey)
      token2 = await insertSecret(tokenSecretMap, secret2, privateKey)
    })

    it('should return 200 and the tokens/secrets', async () => {
      const response = await request(doppler)
        .get(`/tokens?t=${token1},${token2}`)
        .set('Authorization', `Bearer ${API_KEY_1}`)
      expect(response.statusCode).toEqual(200)
      expect(response.body[token1]).toEqual(secret1)
      expect(response.body[token2]).toEqual(secret2)
    })
  })
})

describe('POST /tokens', () => {
  describe('when a bogus API key is used', () => {
    it('should return 400', async () => {
      const response = await request(doppler)
        .post('/tokens')
        .set('Authorization', 'Bearer bogus')
      expect(response.statusCode).toEqual(400)
    })
  })

  describe('when the body contains no secret', () => {
    it('should return 400', async () => {
      const response = await request(doppler)
        .post('/tokens')
        .set('Authorization', `Bearer ${API_KEY_1}`)
      expect(response.statusCode).toEqual(400)
    })
  })

  describe('when the body contains a secret', () => {
    it('should create a token/secret and return 201', async () => {
      const response = await request(doppler)
        .post('/tokens')
        .send({ secret: 'password' })
        .set('Authorization', `Bearer ${API_KEY_1}`)
      expect(response.statusCode).toEqual(201)
      expect(response.body.token).toBeTruthy()

      const { tokenSecretMap } = await getContext(API_KEY_1)
      expect(tokenSecretMap.has(response.body.token))
    })
  })
})

describe('PUT /tokens:/token', () => {
  let token = ''

  beforeEach(async () => {
    const { privateKey, tokenSecretMap } = await getContext(API_KEY_1)
    token = await insertSecret(tokenSecretMap, 'password', privateKey)
  })

  describe('when the body contains no secret', () => {
    it('should return 400', async () => {
      const response = await request(doppler)
        .put(`/tokens/${token}`)
        .set('Authorization', `Bearer ${API_KEY_1}`)
      expect(response.statusCode).toEqual(400)
    })
  })

  describe('when the token does not exist', () => {
    it('should return 400', async () => {
      const response = await request(doppler)
        .put('/tokens/foo')
        .send({ secret: 'drowssap' })
        .set('Authorization', `Bearer ${API_KEY_1}`)
      expect(response.statusCode).toEqual(400)
    })
  })

  describe('when the body contains a secret', () => {
    it('should update the secret and return 204', async () => {
      const newSecret = 'drowssap'
      const response = await request(doppler)
        .put(`/tokens/${token}`)
        .send({ secret: newSecret })
        .set('Authorization', `Bearer ${API_KEY_1}`)
      expect(response.statusCode).toEqual(204)

      const { privateKey, tokenSecretMap } = await getContext(API_KEY_1)
      const secret = tokenSecretMap.get(token)
      if (!secret) throw new Error('Error in PUT /tokens:token test')
      expect(decrypt(secret, privateKey)).toEqual(newSecret)
    })
  })
})

describe('DELETE /tokens:/token', () => {
  let token = ''

  beforeEach(async () => {
    const { privateKey, tokenSecretMap } = await getContext(API_KEY_1)
    token = await insertSecret(tokenSecretMap, 'password', privateKey)
  })

  it('should delete the token/secret and return 204', async () => {
    const response = await request(doppler)
      .delete(`/tokens/${token}`)
      .set('Authorization', `Bearer ${API_KEY_1}`)
    expect(response.statusCode).toEqual(204)

    const { tokenSecretMap } = await getContext(API_KEY_1)
    expect(tokenSecretMap.has(token)).toBe(false)
  })
})

describe('when the rate limit has been exceeded', () => {
  it('should return 429', async () => {
    const response = await request(doppler)
      .get('/tokens')
      .set('Authorization', `Bearer ${API_KEY_1}`)
    expect(response.statusCode).toEqual(429)
  })
})
