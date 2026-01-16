import React from 'react'

const sampleProjects = [
  {
    title: 'Auditorio q',
    desc: 'Descripción breve del proyecto A. Tech stack: React, Vite.',
    link: 'https://mediumspringgreen-woodcock-378101.hostingersite.com/',
    className: 'project-card--auditorio'
  },
  {
    title: 'Terapias Milenarias',
    desc: 'Descripción breve del proyecto B. UI minimalista y responsive.',
    link: 'https://terapiasmilenarias.com/',
    className: 'project-card--terapias'
  }
]

export default function Projects(){
  return (
    <div>
      <h2>Proyectos</h2>
      <div className="projects-grid" role="list">
        {sampleProjects.map((p, i) => (
          <article className={`project ${p.className}`} key={i} role="listitem">
            <h3>{p.title}</h3>
            <p>{p.desc}</p>
            <div style={{marginTop:12}}>
              <a href={p.link}>Ver proyecto</a>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}