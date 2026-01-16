import React from 'react'

export default function Footer(){
  return (
    <footer className="footer" role="contentinfo">
      <div>© {new Date().getFullYear()} Facundo Ortigosa. Diseño minimalista y modular.</div>
    </footer>
  )
}