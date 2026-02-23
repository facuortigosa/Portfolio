import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import About from './components/About.jsx'
import Projects from './components/Projects.jsx'
import Skills from './components/Skills.jsx'
import Contact from './components/Contact.jsx'
import Footer from './components/Footer.jsx'
import BacanGame from './components/BacanGame.jsx'

function Portfolio() {
  return (
    <>
      <Header />
      <main>
        <section id="inicio"><Hero /></section>
        <section id="sobre-mi"><About /></section>
        <section id="proyectos"><Projects /></section>
        <section id="habilidades"><Skills /></section>
        <section id="contacto"><Contact /></section>
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
        <Route path="/BacanGame" element={<BacanGame />} />
      </Routes>
    </BrowserRouter>
  )
}
