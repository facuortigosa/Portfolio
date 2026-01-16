import React from 'react'
import Logo from './Logo.jsx';


const navItems = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'sobre-mi', label: 'Sobre mí' },
  { id: 'proyectos', label: 'Proyectos' },
  { id: 'habilidades', label: 'Habilidades' },
  { id: 'contacto', label: 'Contacto' }
]

export default function Header(){
  return (
    <header className="header" role="banner">
              <div>
      <Logo className="logo-svg"/>
    </div>
      <nav className="nav" role="navigation" aria-label="Navegación principal">
        {navItems.map(item => (
          <a key={item.id} href={`#${item.id}`}>{item.label}</a>
        ))}
      </nav>
    </header>
  )
}