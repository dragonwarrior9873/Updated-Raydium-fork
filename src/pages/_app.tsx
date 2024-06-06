import { PublicKey } from '@solana/web3.js'
import { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import NextNProgress from 'nextjs-progressbar'

import { useClientInitialization, useInnerAppInitialization } from '@/application/common/initializationHooks'
import { useAppInitVersionPostHeartBeat, useJudgeAppVersion } from '@/application/common/useAppVersion'
import useConnectionInitialization from '@/application/connection/useConnectionInitialization'
import useFreshChainTimeOffset from '@/application/connection/useFreshChainTimeOffset'
import { useUserCustomizedEndpointInitLoad } from '@/application/connection/useUserCustomizedEndpointInitLoad'
import useMessageBoardFileLoader from '@/application/messageBoard/useMessageBoardFileLoader'
import useMessageBoardReadedIdRecorder from '@/application/messageBoard/useMessageBoardReadedIdRecorder'
import { useSyncWithSolanaWallet } from '@/application/wallet/useSyncWithSolanaWallet'
import { useWalletAccountChangeListeners } from '@/application/wallet/useWalletAccountChangeListeners'
import { useWalletConnectNotifaction } from '@/application/wallet/useWalletConnectNotifaction'
import { useWalletTxVersionDetector } from '@/application/wallet/useWalletTxVersionDetector'
import { DRAWER_STACK_ID } from '@/components/Drawer'
import NotificationSystemStack from '@/components/NotificationSystemStack'
import { POPOVER_STACK_ID } from '@/components/Popover'
import { SolanaWalletProviders } from '@/components/SolanaWallets/SolanaWallets'
import { createDOMElement } from '@/functions/dom/createDOMElement'
import toPubString from '@/functions/format/toMintString'
import { inClient } from '@/functions/judgers/isSSR'
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect'
import WalletSelectorDialog from '@/pageComponents/dialogs/WalletSelectorDialog'
import { setAutoFreeze } from 'immer'

import '../styles/index.css'
setAutoFreeze(false)

export default function MyApp({ Component, pageProps }: AppProps) {
  const { pathname } = useRouter()

  /* add popup stack */
  useIsomorphicLayoutEffect(() => {
    if (inClient) {
      const hasPopoverStack = Boolean(document.getElementById(POPOVER_STACK_ID))
      if (hasPopoverStack) return
      const popoverStackElement = createDOMElement({
        classNames: ['fixed', 'z-popover', 'inset-0', 'self-pointer-events-none'],
        id: POPOVER_STACK_ID
      })
      document.body.append(popoverStackElement)
    }

    if (inClient) {
      const hasDrawerStack = Boolean(document.getElementById(DRAWER_STACK_ID))
      if (hasDrawerStack) return
      const drawerStackElement = createDOMElement({
        classNames: ['fixed', 'z-drawer', 'inset-0', 'self-pointer-events-none'],
        id: DRAWER_STACK_ID
      })
      document.body.append(drawerStackElement)
    }
  }, [])

  return (
    <SolanaWalletProviders>
      {/* initializations hooks */}
      <ClientInitialization />
      {/* {pathname == '/' && <ApplicationsInitializations />} */}
      <ApplicationsInitializations />
      <div className="app">
        <NextNProgress color="#34ade5" showOnShallow={false} />

        {/* Page Components */}
        <Component {...pageProps} />

        {/* Global Components */}
        <WalletSelectorDialog />
        <NotificationSystemStack />
      </div>
    </SolanaWalletProviders>
  )
}

// accelerayte
PublicKey.prototype.toString = function () {
  return toPubString(this)
}
PublicKey.prototype.toJSON = function () {
  return toPubString(this)
}

function ClientInitialization() {
  useClientInitialization()

  return null
}

function ApplicationsInitializations() {
  useInnerAppInitialization()

  /********************** appVersion **********************/
  useAppInitVersionPostHeartBeat()
  useJudgeAppVersion()

  /********************** connection **********************/
  useUserCustomizedEndpointInitLoad()
  useConnectionInitialization()
  useFreshChainTimeOffset()

  /********************** message boards **********************/
  useMessageBoardFileLoader() // load `raydium-message-board.json`
  useMessageBoardReadedIdRecorder() // sync user's readedIds

  /********************** wallet **********************/

  // experimental features. will not let user see
  // useInitShadowKeypairs()
  useSyncWithSolanaWallet()
  useWalletConnectNotifaction()
  useWalletTxVersionDetector()
  useWalletAccountChangeListeners()

  return null
}
