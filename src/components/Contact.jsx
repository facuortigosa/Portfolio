import React, { useRef } from 'react'
import emailjs from '@emailjs/browser'

export default function Contact() {
  const formRef = useRef()

  const handleSubmit = (e) => {
    e.preventDefault()

    emailjs.sendForm(
      'service_rpodwpd',
      'template_d789z5u',
      formRef.current,
      { publicKey: 'o8Tf6oJbaADI83tI2' }
    )
    .then(() => {
      alert('Mensaje enviado con éxito!')
    }, (error) => {
      alert('Error al enviar: ' + error.text)
    })
  }

  return (
    <div>
      <h2>Contacto</h2>
      <div className="contact-grid">
        <form
          ref={formRef}
          className="contact-form"
          onSubmit={handleSubmit}
          aria-label="Formulario de contacto"
        >
          <input className="input" name="user_name" placeholder="Nombre" required />
          <input className="input" name="user_email" type="email" placeholder="Email" required />
          <textarea className="input" name="message" rows="6" placeholder="Mensaje" required />
          <button className="button" type="submit">Enviar</button>
        </form>

        <aside className="card" aria-label="Información de contacto">
          <h3>Otras formas de contacto</h3>
          <p style={{color:'var(--muted)'}}>Puedes escribirme por email o en redes sociales.</p>
          <p style={{marginTop:12}}>
            <strong>Email</strong><br />
            <a href="mailto:facu_ortigosa@hotmail.com">facu_ortigosa@hotmail.com</a>
          </p>
        </aside>
      </div>
    </div>
  )
}