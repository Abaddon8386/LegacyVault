import { useState } from 'react'
import { translations } from './i18n/translations'
import { DashboardLayout } from './layouts/DashboardLayout'
import { AssetManagementPage } from './pages/assets/AssetManagementPage'

function App() {
  const [lang, setLang] = useState('vi')

  function handleToggleLang() {
    setLang((prev) => (prev === 'vi' ? 'en' : 'vi'))
  }

  const currentT = translations[lang]

  return (
    <DashboardLayout
      t={currentT}
      lang={lang}
      onToggleLang={handleToggleLang}
      activeNav="assets"
    >
      <AssetManagementPage t={currentT} />
    </DashboardLayout>
  )
}

export default App
