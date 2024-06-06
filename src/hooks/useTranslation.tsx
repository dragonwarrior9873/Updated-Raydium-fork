import enUS from '@/translations/en-US'
import { useRouter } from 'next/router'

/**
 * access ../translations
 */
export default function useTranslation() {
  const { locale, asPath, push } = useRouter()
  const availableLanguages = ['en-US'] as const
  function changeLanguage(targetLanguage: typeof availableLanguages[number]) {
    push(asPath, asPath, { locale: targetLanguage })
  }
  return { t: enUS, currentLanguage: locale, availableLanguages, changeLanguage }
}
