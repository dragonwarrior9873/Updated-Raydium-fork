import { ReactNode } from 'react'
import { Transaction, VersionedTransaction } from '@solana/web3.js'

export interface NormalNotificationItemInfo {
  type?: 'success' | 'warning' | 'error' | 'info'
  title?: ReactNode
  subtitle?: ReactNode
  description?: ReactNode
}

type TxNotificationSingleItemInfo = {
  transaction: Transaction | VersionedTransaction
  /** @default 'queuing' */
  state?: 'success' | 'error' | 'aborted' | 'queuing' | 'processing'
  /** not txid when not send */
  txid?: string
  /** only for error */
  error?: unknown
}

export interface TxNotificationItemInfo {
  txInfos: TxNotificationSingleItemInfo[]
}

export type TxNotificationController = {
  changeItemInfo(
    info: Omit<Partial<TxNotificationSingleItemInfo>, 'transaction'>,
    options: { transaction: Transaction | VersionedTransaction }
  ): void
}
