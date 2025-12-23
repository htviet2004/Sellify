import { useState } from 'react'
import Header from './Header.jsx'
import Footer from './Footer.jsx'
import AuthModal from './AuthModal.jsx'

export default function Layout({ 
  children, 
  className = "",
  showFooter = true 
}) {
  const [query, setQuery] = useState('')
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')

  return (
    <div className={`layout ${className}`}>
      
      <main className="main-content">
        {children}
      </main>
      
      {showFooter && <Footer />}
      
      <AuthModal 
        open={isAuthOpen} 
        initialMode={authMode} 
        onClose={() => setIsAuthOpen(false)} 
      />
    </div>
  )
}
