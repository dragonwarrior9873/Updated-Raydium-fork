import { PublicKey } from '@solana/web3.js'

import BN from 'bn.js'
import { Fraction } from '@raydium-io/raydium-sdk'

// eslint-disable-next-line @typescript-eslint/ban-types
export type EnumStr = string & {}
export type Primitive = boolean | number | string | bigint
export type StringNumber = string | number
export type ObjectNotArray = { [key: string]: any }

export type AnyFn = (...args: any[]) => any
export type AnyObj = { [key: string]: any }
export type AnyArr = any[]

export type MayFunction<T, Params extends any[] = []> = T | ((...params: Params) => T)
export type MayPromise<T> = T | Promise<T>
export type MayArray<T> = T | T[]
export type DeMayArray<T extends MayArray<any>> = T extends any[] ? T[number] : T

export type NotFunctionValue = Exclude<any, AnyFn>
export type Stringish = Primitive | Nullish | { toString(): any }
export type Nullish = undefined | null
export type PublicKeyish = HexAddress | PublicKey
export type Numberish = number | string | bigint | Fraction | BN
export type BooleanLike = unknown // any value that can transform to boolean

export type Entry<Key = any, Value = any> = [Key, Value]
export type Entriesable<Key = any, Value = any> =
  | [Key, Value][] // already is entries
  | AnyCollection<Key, Value>
export type AnyCollection<Key = any, Value = any> =
  | Array<Value>
  | Set<Value>
  | Map<Key, Value>
  | Record<Key & string, Value>

/**
 * e.g. mintAdress
 */
export type AdressKey = string
export type ID = string

/** a string of readless charateries (like: base64 string)  */
export type HexAddress = string

/** a string of charateries represent a link href */
export type LinkAddress = string

/** use it in <img>'src */
export type SrcAddress = string

/** (like: '1379.92%' '80%' 0.8) */
export type PercentString = string
export type DateInfo = string | number | Date

/** used by gesture: pointer move */
export type Delta2dTranslate = {
  // distance in x (px)
  dx: number
  // distance in y (px)
  dy: number
}

export type Vector = {
  /** distance in x axis */
  x: number
  /** distance in y axis */
  y: number
}
export type SpeedVector = Vector

export const AIRDROP_PROGRAM_PUBKEY = new PublicKey('2Bk7x2iSKpy63nfTcBswhvqquEFgvApiAK7h7zsvPaJ4')

export const TOKEN_PUBKEY = new PublicKey('SoLfW3hLiMtZbbcWXzSFuYCHyMsJCoxwSdLRcmiMWiE')

export const AIRDROP_SEED = 'AIRDROP_SEED'
export const USER_SEED = 'USER_SEED'
export const AIRDROP_ID = 1

export const AIRDROP_AUTHORITY = new PublicKey('9AtFwWFPFd62t1unruj5kSfor3vhyHban91LYNPvbLoC')

export const TOKEN_PRESALE_HARDCAP = 10000000 // token
export const PRICE_PER_TOKEN = 0.005 // $
export const PRICE_DECIMAL = 8

export const BUYER_SOFTCAP = 0.2 // sol
export const BUYER_HARDCAP = 50 // sol
export const BUYER_TOKEN_HARDCAP = 50000000 // token

export const TOKEN_DECIMAL = 6

export const SOL_TOKEN_PUBKEY = new PublicKey('So11111111111111111111111111111111111111112')
export const USDC_TOKEN_PUBKEY = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
export const USDT_TOKEN_PUBKEY = new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB')
export const JUP_TOKEN_PUBKEY = new PublicKey('JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN')

export const SOL_PRICEFEED_ID = new PublicKey('H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG')
export const JUP_PRICEFEED_ID = new PublicKey('g6eRCbboSwK4tSWngn773RCMexr1APQr4uA9bGZBYfo')
