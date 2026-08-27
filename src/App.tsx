import { Routes, Route, useLocation } from 'react-router'
import { lazy, Suspense, useEffect } from 'react'
import Home from './pages/Home'

const Admin = lazy(() => import('./pages/Admin'))
const Sample = lazy(() => import('./pages/Sample'))
const Privacy = lazy(() => import('./pages/Legal').then((module) => ({ default: module.Privacy })))
const Terms = lazy(() => import('./pages/Legal').then((module) => ({ default: module.Terms })))
const Refund = lazy(() => import('./pages/Legal').then((module) => ({ default: module.Refund })))
const Contact = lazy(() => import('./pages/Legal').then((module) => ({ default: module.Contact })))

function PageFallback() {
  return <div className="min-h-screen bg-[#fbf5ef]" aria-label="Loading page" />
}

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollTop />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/refund" element={<Refund />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/sample" element={<Sample />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Suspense>
    </>
  )
}
