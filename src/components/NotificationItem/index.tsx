import { useEffect, useRef } from 'react'

import useToggle from '@/hooks/useToggle'
import { Transition } from '@headlessui/react'

import { PopInfoNormalNotificationItem } from '../NotificationSystemStack'
import { NormalNotificationItemCard } from './NormalNotificationItemCard'

export default function NotificationItem(props: PopInfoNormalNotificationItem) {
  const [isOpen, { off: close }] = useToggle(true)
  const [nodeExist, { off: destory }] = useToggle(true)

  // for transition
  const itemWrapperRef = useRef<HTMLDivElement>(null)

  // for tx notification controller
  const controller = useRef(null)

  if (!nodeExist) return null
  return (
    <Transition
      appear
      show={isOpen}
      enter="transition-all duration-500"
      enterFrom="opacity-0 transform origin-right-bottom translate-x-full scale-0" // transform direction is controlled by translate-x-full
      enterTo="opacity-100 transform origin-right-bottom translate-x-0 scale-100"
      leave="transition-all duration-500"
      leaveFrom="opacity-100 transform origin-right-bottom translate-x-0 scale-100"
      leaveTo="opacity-0 transform origin-right-bottom translate-x-full scale-0"
      beforeEnter={() => {
        // seems headlessui/react 1.6 will get react 18's priority strategy. 👇 fllowing code will invoke **before** element load
        itemWrapperRef.current?.style.setProperty('position', 'absolute') // init will rerender element, "position:absolute" is for not affect others
        itemWrapperRef.current?.style.setProperty('visibility', 'hidden')

        setTimeout(() => {
          itemWrapperRef.current?.style.removeProperty('position')
          const height = itemWrapperRef.current?.clientHeight
          itemWrapperRef.current?.style.setProperty('height', '0')
          // get a layout property to manually to force the browser to layout the above code.
          // So trick. But have to.🤯🤯🤯🤯
          itemWrapperRef.current?.clientHeight
          itemWrapperRef.current?.style.setProperty('height', `${height}px`)
          itemWrapperRef.current?.style.removeProperty('visibility')
        })
      }}
      afterEnter={() => {
        itemWrapperRef.current?.style.removeProperty('height')
      }}
      beforeLeave={() => {
        setTimeout(() => {
          const height = itemWrapperRef.current?.clientHeight
          itemWrapperRef.current?.style.setProperty('height', `${height}px`)
          // get a layout property to manually to force the browser to layout the above code.
          // So trick. But have to.🤯🤯🤯🤯
          itemWrapperRef.current?.clientHeight
          itemWrapperRef.current?.style.setProperty('height', '0')
        })
      }}
      afterLeave={() => {
        destory()
      }}
    >
      {/* U have to gen another <div> to have the gap between <NotificationItem> */}
      <div ref={itemWrapperRef} className={`overflow-hidden mobile:w-screen transition-all duration-500`}>
        <NormalNotificationItemCard info={props.info} close={close} />
      </div>
    </Transition>
  )
}
