import { Request } from 'express'

/* GET endpoint types */
export interface GetTokensResponseBody {
  [token: string]: string
}

export interface GetTokensRequestQuery {
  t?: string
}

export type GetTokensRequest = Request<{}, GetTokensResponseBody | string, {}, GetTokensRequestQuery>

/* POST, PUT, and DELETE endpoint types */
export interface TokenObject {
  token: string
}

export interface SecretRequestBody {
  secret: string
}

export type PostTokenRequest = Request<{}, TokenObject | string, SecretRequestBody, {}>
export type PutTokenRequest = Request<TokenObject, void | string, SecretRequestBody, {}>
export type DeleteTokenRequest = Request<TokenObject>
