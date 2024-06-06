import router from 'next/router'

import { ParsedUrlQuery } from 'querystring'
import { shrinkToValue } from '@/functions/shrinkToValue'
import { MayFunction } from '@/types/constants'

export type PageRouteConfigs = {
  '': string
}

export type PageRouteName = keyof PageRouteConfigs

const innerRouteStack = [] as { url: string }[]

// TODO: parse url query function (can have prevState of zustand store)
export function routeTo<ToPage extends keyof PageRouteConfigs>(
  // eslint-disable-next-line @typescript-eslint/ban-types
  toPage: ToPage | (string & {}),
  opts?: MayFunction<PageRouteConfigs[ToPage], [{ currentPageQuery: ParsedUrlQuery }]>
) {
  const options = shrinkToValue(opts, [{ currentPageQuery: router.query }])
  /** get info from queryProp */
  innerRouteStack.push({ url: toPage })

  return router.push({ pathname: toPage })
}

export const routeBack = () => {
  innerRouteStack.pop()
  router.back()
}

export const routeBackTo = (url: keyof PageRouteConfigs) => {
  const lastIsTarget = innerRouteStack[innerRouteStack.length - 2]?.url === url
  if (lastIsTarget) {
    routeBack()
  } else {
    routeTo(url)
  }
}

export const routeReplace = (url: string) => router.replace(url)

export function getRouterStackLength() {
  return innerRouteStack.length
}
