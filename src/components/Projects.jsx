import React from 'react'

const sampleProjects = [
  {
    title: 'AUDITORIO Q',
    desc: '',
    link: 'https://auditorio-q-1itxecsf4bhu3bth.builder-preview.com/',
    className: 'project-card--auditorio'
  },
  {
    title: 'Terapias Milenarias',
    desc: '',
    link: 'https://terapiasmilenarias.com/',
    className: 'project-card--terapias'
  },

  {
    title: 'REFUGIO EL MURITO',
    desc: '',
    link: 'https://refugio-el-murito-mje43loqxzsoklwq.builder-preview.com/',
    className: 'project-card--elmurito'
  },

  {
    title: 'BACAN STREET FOOD',
    desc: 'Jueguito',
    link: 'https://facuortigosa.com/BacanGame ',
    className: 'project-card--bacan'
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