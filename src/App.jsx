import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import Projects from './components/Projects.jsx'
import Skills from './components/Skills.jsx'
import Footer from './components/Footer.jsx'
import BacanGame from './components/bacanjunglerun.jsx'
import ProyectoQ from './components/proyectoq.jsx'

function Portfolio() {
  return (
    <>
      <Header />
      <main>
        <section id="inicio"><Hero /></section>
        <section id="proyectos"><Projects /></section>
        <section id="habilidades"><Skills /></section>
        <Footer />
      </main>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Portfolio />} />
        <Route path="/bacanjunglerun" element={<BacanGame />} />
        <Route path="/proyectoq" element={<ProyectoQ />} />
      </Routes>
    </BrowserRouter>
  )
}
