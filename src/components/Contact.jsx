import React, { useState } from 'react'

export default function Contact(){
  const [form, setForm] = useState({name:'', email:'', message:''})
  const handleChange = e => setForm({...form, [e.target.name]: e.target.value})
  const handleSubmit = e => {
    e.preventDefault()
    // Formulario base: aquí puedes integrar tu backend o servicio de email
    const mailto = `mailto:tu@email.com?subject=${encodeURIComponent('Contacto desde portfolio')}&body=${encodeURIComponent(
      `Nombre: ${form.name}\nEmail: ${form.email}\n\n${form.message}`
    )}`
    window.location.href = mailto
  }

  return (
    <div>
      <h2>Contacto</h2>
      <div className="contact-grid">
        <form className="contact-form" onSubmit={handleSubmit} aria-label="Formulario de contacto">
          <input className="input" name="name" placeholder="Nombre" value={form.name} onChange={handleChange} required />
          <input className="input" name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <textarea className="input" name="message" rows="6" placeholder="Mensaje" value={form.message} onChange={handleChange} required />
          <button className="button" type="submit">Enviar</button>
        </form>

        <aside className="card" aria-label="Información de contacto">
          <h3>Otras formas de contacto</h3>
          <p style={{color:'var(--muted)'}}>Puedes escribirme por email o en redes profesionales.</p>
          <p style={{marginTop:12}}>
            <strong>Email</strong><br />
            <a href="mailto:facu_ortigosa@hotmail.com">facu_ortigosa@hotmail.com</a>
          </p>
        </aside>
      </div>
    </div>
  )
}