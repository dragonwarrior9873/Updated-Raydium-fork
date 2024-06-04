import { ApiClmmPositionLinePoint, Fraction, Percent } from '@raydium-io/raydium-sdk'
import { SplToken } from '@/application/token/type'
import { isMintEqual } from '@/functions/judgers/areEqual'
import { gt } from '@/functions/numberish/compare'
import { div, mul } from '@/functions/numberish/operations'
import toFraction from '@/functions/numberish/toFraction'
import { Numberish } from '@/types/constants'

import { ChartPoint } from './type'
import { toPercent } from '@/functions/format/toPercent'
import base58 from 'bs58'
import axios from 'axios'
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js'

export function canTokenPairBeSelected(targetToken: SplToken | undefined, candidateToken: SplToken | undefined) {
  return !isMintEqual(targetToken?.mint, candidateToken?.mint)
}

export function toXYChartFormat(points: ApiClmmPositionLinePoint[]): ChartPoint[] {
  return points.map(({ liquidity, price }) => ({
    x: Number(price),
    y: Number(liquidity)
  }))
}

export async function sendAndConfirmSignedTransactions(useJito, connection, transactions) {
  if (useJito) {
    try {
      const rawTxns = transactions.map((item) => base58.encode(item.serialize()))
      // const verTxns = base64Txns.map(item => VersionedTransaction.deserialize(Buffer.from(item, "base64")));
      // const rawTxns = verTxns.map(item => bs58.encode(item.serialize()));
      const beforeSent = Date.now()
      const { data: bundleRes } = await axios.post(
        `https://mainnet.block-engine.jito.wtf/api/v1/bundles`,
        // const { data: bundleRes } = await axios.post(`https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles`,
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'sendBundle',
          params: [rawTxns]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (bundleRes) {
        const bundleId = bundleRes.result

        const sentTime = Date.now()
        while (Date.now() - sentTime < 90000) {
          try {
            // const { data: bundleStat } = await axios.post(`https://ny.mainnet.block-engine.jito.wtf/api/v1/bundles`,
            const { data: bundleStat } = await axios.post(
              `https://mainnet.block-engine.jito.wtf/api/v1/bundles`,
              {
                jsonrpc: '2.0',
                id: 1,
                method: 'getBundleStatuses',
                params: [[bundleId]]
              },
              {
                headers: {
                  'Content-Type': 'application/json'
                }
              }
            )

            if (bundleStat) {
              const bundleStatuses = bundleStat.result.value
              console.warn('Bundle Statuses:', bundleStatuses)
              const matched = bundleStatuses.find((item) => item.bundle_id === bundleId)
              if (
                matched &&
                (matched.confirmation_status === 'finalized' || matched.confirmation_status === 'confirmed')
              ) {
                console.warn('Time to take using Jupito', Date.now() - beforeSent)
                return bundleId
              }
            }
          } catch (err) {
            console.warn(err)
          }

          await sleep(1000)
        }
      }
    } catch (err) {
      console.warn(err)
    }
  }
  return null
}

export async function getTipTransaction(connection, ownerPubkey, tip) {
  try {
    const { data } = await axios.post(
      'https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles',
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'getTipAccounts',
        params: []
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    const tipAddrs = data.result
    // const getRandomNumber = (min, max) => {
    //     return Math.floor(Math.random() * (max - min + 1)) + min;
    // };
    console.warn('Adding tip transactions...', tip)

    const tipAccount = new PublicKey(tipAddrs[0])
    const instructions = [
      SystemProgram.transfer({
        fromPubkey: ownerPubkey,
        toPubkey: tipAccount,
        lamports: LAMPORTS_PER_SOL * tip
      })
    ]
    const recentBlockhash = (await connection.getLatestBlockhash('finalized')).blockhash
    const messageV0 = new TransactionMessage({
      payerKey: ownerPubkey,
      recentBlockhash,
      instructions
    }).compileToV0Message()

    return new VersionedTransaction(messageV0)
  } catch (err) {
    console.warn(err)
  }
  return null
}

export async function getTipAccounts() {
  try {
    const { data } = await axios.post(
      'https://mainnet.block-engine.jito.wtf/api/v1/bundles',
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'getTipAccounts',
        params: []
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    return data.result
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err)
  }
  return []
}

export const getRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

interface CalculateProps {
  coin1Amount?: Numberish
  coin2Amount?: Numberish
  currentPrice?: Fraction
  coin1InputDisabled: boolean
  coin2InputDisabled: boolean
}
export function calculateRatio({
  coin1Amount,
  coin2Amount,
  currentPrice,
  coin1InputDisabled,
  coin2InputDisabled
}: CalculateProps): { ratio1?: Percent; ratio2?: Percent } {
  const [amount1, amount2] = [(coin1InputDisabled ? '0' : coin1Amount) || '0', coin2InputDisabled ? '0' : coin2Amount]
  const [amount1HasVal, amount2HasVal] = [gt(amount1, 0), gt(amount2, 0)]
  const amount2Fraction = toFraction(amount2 || '0')
  const denominator = currentPrice
    ? amount1HasVal
      ? mul(amount1, currentPrice).add(amount2Fraction)
      : amount2HasVal
      ? amount2Fraction
      : toFraction(1)
    : toFraction(1)

  try {
    const ratio1 = currentPrice ? div(mul(amount1, currentPrice), denominator) : toPercent(0)
    const ratio2 = currentPrice ? div(amount2Fraction, denominator) : toPercent(0)
    return { ratio1, ratio2 }
  } catch {
    return {}
  }
}
