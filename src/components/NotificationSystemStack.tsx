import { ReactNode, useEffect, useMemo, useState } from 'react'

import useAppSettings from '@/application/common/useAppSettings'
import useNotification from '@/application/notification/useNotification'
import ConfirmDialog, { ConfirmDialogInfo } from '../pageComponents/dialogs/ConfirmDialog'
import Col from './Col'
import NotificationItem from './NotificationItem'
import { NormalNotificationItemInfo, TxNotificationController, TxNotificationItemInfo } from './NotificationItem/type'

export type PopInfoNormalNotificationItem = {
  is: 'notificationItem'
  info: NormalNotificationItemInfo
}

export type PopInfoConfirmDialog = {
  is: 'confirmDialog'
  info: ConfirmDialogInfo
}

export type PopInfoWelcomeDialog = {
  is: 'welcomeDialog'
  info: {
    content: ReactNode
    onConfirm?: () => void
  }
}

//#region ------------------- core definition -------------------
type PopInfo = PopInfoNormalNotificationItem | PopInfoConfirmDialog | PopInfoWelcomeDialog

export default function NotificationSystemStack() {
  const [stack, setStack] = useState<PopInfo[]>([])
  const isMobile = useAppSettings((s) => s.isMobile)
  const explorerName = useAppSettings((s) => s.explorerName)

  //
  const notificationItemInfos = useMemo(
    () =>
      stack.filter((i) => i.is === 'notificationItem') as (
        | PopInfoNormalNotificationItem
      )[],
    [stack]
  )
  const confirmDialogInfos = useMemo(
    () => stack.filter((i) => i.is === 'confirmDialog') as PopInfoConfirmDialog[],
    [stack]
  )
  const popDialogInfos = useMemo(() => stack.filter((i) => i.is === 'welcomeDialog') as PopInfoWelcomeDialog[], [stack])
  useEffect(() => {
    const log = (info: NormalNotificationItemInfo) => {
      setStack((s) => s.concat({ is: 'notificationItem', info }))
    }
    const popConfirm = (info: ConfirmDialogInfo) => {
      setStack((s) => s.concat({ is: 'confirmDialog', info }))
    }

    useNotification.setState({
      log,
      logError(title: string | Error | unknown, description?: ReactNode) {
        const errorTitle = title instanceof Error ? title.name : title ? String(title) : ''
        const errorDescription = title instanceof Error ? title.message : description
        log({ type: 'error', title: errorTitle, description: errorDescription })
      },
      logWarning(title: string, description?: ReactNode) {
        log({ type: 'warning', title, description })
      },
      logSuccess(title: string, description?: ReactNode) {
        log({ type: 'success', title, description })
      },
      logInfo(title: string, description?: ReactNode) {
        log({ type: 'info', title, description })
      },
      popConfirm,
      popWelcomeDialog(content, { onConfirm }: { onConfirm?: () => void } = {}) {
        setStack((s) => s.concat({ is: 'welcomeDialog', info: { content, onConfirm } }))
      }
    })
  }, [explorerName])

  return (
    <>
      <Col
        className="items-end mobile:items-stretch pointer-events-none"
        style={{
          position: 'fixed',
          right: '0',
          bottom: '0',
          zIndex: 9999
        }}
      >
        {notificationItemInfos.map((itemInfo, idx, total) => {
          const idxFromLast = total.length - idx
          if (idxFromLast > 3) return null // only 3 items may exist at the same time
          return <NotificationItem key={idx} info={itemInfo.info}  is={itemInfo.is}/>
        })}
      </Col>
      {confirmDialogInfos.map(({ info }, idx) => (
        <ConfirmDialog key={idx} {...info} />
      ))}
      
    </>
  )
}
