import { useEffect, useState, useRef } from 'react'
import '../assets/Home.css'

export default function HeroSlider({ slides = [] , interval = 4000 }){
  const [index, setIndex] = useState(0)
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (!slides || slides.length <= 1) return
    timeoutRef.current = setTimeout(() => {
      setIndex(i => (i + 1) % slides.length)
    }, interval)
    return () => clearTimeout(timeoutRef.current)
  }, [index, slides, interval])

  if (!slides || slides.length === 0) return null

  return (
    <div className="hero-slider">
      <div className="hero-slides" style={{ transform: `translateX(${ -index * 100 }%)` }}>
        {slides.map((s, i) => (
          <div className="hero-slide" key={i} style={{ backgroundImage: `url(${s.image})` }}>
            <div className="hero-slide-inner">
              {s.title && <h2>{s.title}</h2>}
              {s.subtitle && <p>{s.subtitle}</p>}
              {s.cta && <a className="btn btn-primary" href={s.cta.href || '#'}>{s.cta.label || 'Shop now'}</a>}
            </div>
          </div>
        ))}
      </div>
      <div className="hero-dots">
        {slides.map((_, i) => (
          <button key={i} className={`hero-dot ${i === index ? 'active' : ''}`} onClick={() => setIndex(i)} />
        ))}
      </div>
    </div>
  )
}
