import React from 'react'

const skills = [
  'React', 'JavaScript', 'HTML', 'CSS', 'Vite',
  'Responsive Design', 'Accessibility', 'GitHub', 'UI/UX Basics'   
]

export default function Skills(){
  return (
    <div>
      <h2>Habilidades</h2>
      <div className="skills-list" aria-label="Lista de habilidades">
        {skills.map((s, i) => (
          <div className="skill" key={i}>{s}</div>
        ))}
      </div>
    </div>
  )
}