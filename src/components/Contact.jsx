import React, { useRef, useState } from 'react'
import emailjs from '@emailjs/browser'

export default function Contact() {
  const formRef = useRef()
  const [status, setStatus] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

    setStatus({ type: 'loading', message: 'Enviando mensaje...' })

    emailjs.sendForm(
      serviceId,
      templateId,
      formRef.current,
      { publicKey }
    )
    .then(() => {
      setStatus({ type: 'success', message: 'Mensaje enviado con éxito. ¡Gracias por escribir!' })
      formRef.current.reset()
    }, () => {
      setStatus({ type: 'error', message: 'Hubo un error al enviar el mensaje. Por favor, intenta nuevamente.' })
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
          <button className="button" type="submit" disabled={status?.type === 'loading'}>
            {status?.type === 'loading' ? 'Enviando...' : 'Enviar'}
          </button>
          {status && (
            <p
              aria-live="polite"
              style={{
                marginTop: 12,
                color:
                  status.type === 'success'
                    ? 'var(--accent)'
                    : status.type === 'error'
                    ? 'var(--danger, #f87171)'
                    : 'var(--muted)',
                fontSize: 14
              }}
            >
              {status.message}
            </p>
          )}
        </form>

        <aside className="card" aria-label="Información de contacto">
          <h3>Otras formas de contacto</h3>
          <p style={{color:'var(--muted)'}}>Puedes escribirme por email o en redes sociales.</p>
          <p style={{marginTop:12}}>
            <strong>Email</strong><br />
            <a href="mailto:facu@facuortigosa.com">facu@facuortigosa.com</a>
          </p>
        </aside>
      </div>
    </div>
  )
}