import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SITE_INFO, COPYRIGHT_YEAR } from '../config/siteInfo'
import { API_URL } from '../utils/api'
import { useLenis } from '../components/SmoothScrollProvider'
import './HomePage.css'

gsap.registerPlugin(ScrollTrigger)

function HomePage() {
  const navigate = useNavigate()
  const lenis = useLenis()
  const formRef = useRef(null)
  const rootRef = useRef(null)
  const heroMediaRef = useRef(null)
  const prefersReducedMotion = useReducedMotion()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isHeaderHidden, setIsHeaderHidden] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [newsItems, setNewsItems] = useState([])
  const [animatedStats, setAnimatedStats] = useState({ count: 0, year: 0 })
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    message: ''
  })

  const defaultNews = useMemo(() => [
    {
      _id: 'default-1',
      date: '2025-11-10',
      title: "Grande collecte d'hiver réussie",
      description: "Une mobilisation solidaire pour renforcer les dons en vêtements, couvertures et denrées.",
      image: '/images/actualites/news-1.jpg'
    },
    {
      _id: 'default-2',
      date: '2025-10-25',
      title: 'Nouveaux partenariats locaux',
      description: "Des acteurs locaux rejoignent nos actions pour soutenir l'accompagnement social.",
      image: '/images/actualites/news-2.jpg'
    },
    {
      _id: 'default-3',
      date: '2025-10-15',
      title: 'Accompagnement vers une seconde chance',
      description: "Chaque parcours est suivi avec écoute, dignité et coordination avec les services concernés.",
      image: '/images/actualites/news-3.jpg'
    }
  ], [])

  const impactStats = [
    { value: `${animatedStats.count}+`, label: 'personnes accompagnées' },
    { value: '24/7', label: 'prise en charge humaine' },
    { value: animatedStats.year, label: 'centre mis en place' }
  ]

  const services = [
    {
      label: 'Hébergement',
      text: "Accueil et prise en charge des personnes en situation de rue, notamment pendant les périodes les plus difficiles."
    },
    {
      label: 'Repas et dons',
      text: "Distribution de repas, denrées, vêtements, couvertures et produits d'hygiène selon les besoins."
    },
    {
      label: 'Accompagnement',
      text: "Soutien social, psychologique et orientation vers les services et partenaires compétents."
    },
    {
      label: 'Réinsertion',
      text: "Actions de suivi pour aider chaque personne à retrouver stabilité, autonomie et dignité."
    }
  ]

  const helpWays = [
    'Repas préparés ou denrées alimentaires',
    'Vêtements propres, couvertures et literie',
    "Produits d'hygiène et fournitures essentielles",
    'Temps bénévole, partenariats et soutien logistique'
  ]

  useEffect(() => {
    let lastY = window.scrollY
    let ticking = false
    const HIDE_AFTER = 140
    const DELTA = 6

    const update = () => {
      const y = window.scrollY
      setIsScrolled(y > 24)
      if (isMenuOpen || y <= HIDE_AFTER) {
        setIsHeaderHidden(false)
      } else if (y - lastY > DELTA) {
        setIsHeaderHidden(true)
      } else if (lastY - y > DELTA) {
        setIsHeaderHidden(false)
      }
      lastY = y
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update)
        ticking = true
      }
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isMenuOpen])

  useEffect(() => {
    let mounted = true

    const loadNews = async () => {
      try {
        const res = await fetch(`${API_URL}/news?limit=3`)
        if (!res.ok) throw new Error('News request failed')
        const json = await res.json()
        const data = Array.isArray(json?.data) ? json.data : []
        if (mounted) setNewsItems(data.length ? data : defaultNews)
      } catch {
        if (mounted) setNewsItems(defaultNews)
      }
    }

    loadNews()
    return () => {
      mounted = false
    }
  }, [defaultNews])

  useEffect(() => {
    if (prefersReducedMotion) return undefined

    const ctx = gsap.context(() => {
      const heroImg = heroMediaRef.current?.querySelector('img')
      if (heroImg) {
        gsap.to(heroImg, {
          yPercent: 18,
          scale: 1.08,
          ease: 'none',
          scrollTrigger: {
            trigger: '.public-hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true
          }
        })
      }

      const revealSelectors = [
        '.public-mission-grid article',
        '.public-services-grid article',
        '.public-news-grid article',
        '.public-help-list li',
        '.public-contact-card > div',
        '.public-contact-form'
      ]
      revealSelectors.forEach((selector) => {
        const items = gsap.utils.toArray(selector)
        if (!items.length) return
        gsap.from(items, {
          y: 36,
          opacity: 0,
          duration: 0.85,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: {
            trigger: items[0].parentElement,
            start: 'top 82%',
            once: true
          }
        })
      })

      gsap.utils.toArray('.public-section-heading').forEach((heading) => {
        gsap.from(heading, {
          y: 26,
          opacity: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: { trigger: heading, start: 'top 86%', once: true }
        })
      })
    }, rootRef)

    return () => ctx.revert()
  }, [prefersReducedMotion, newsItems])

  useEffect(() => {
    if (prefersReducedMotion) {
      setAnimatedStats({ count: SITE_INFO.stats.beneficiariesCurrent, year: SITE_INFO.stats.foundedYear })
      return undefined
    }
    const target = { count: SITE_INFO.stats.beneficiariesCurrent, year: SITE_INFO.stats.foundedYear }
    const state = { count: 0, year: target.year - 6 }
    const tween = gsap.to(state, {
      count: target.count,
      year: target.year,
      duration: 1.8,
      ease: 'power2.out',
      delay: 0.4,
      onUpdate: () => setAnimatedStats({ count: Math.round(state.count), year: Math.round(state.year) })
    })
    return () => tween.kill()
  }, [prefersReducedMotion])

  const goToSection = (id) => {
    setIsMenuOpen(false)
    const target = document.getElementById(id)
    if (!target) return
    if (lenis) {
      lenis.scrollTo(target, { offset: -96, duration: 1.2 })
    } else {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const formatDateFr = (value) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const subject = encodeURIComponent(`Contact site - ${formData.nom}`)
    const body = encodeURIComponent(
      `Nom: ${formData.nom}\nEmail: ${formData.email}\nTelephone: ${formData.telephone}\n\n${formData.message}`
    )
    window.location.href = `mailto:${SITE_INFO.contact.email}?subject=${subject}&body=${body}`
  }

  return (
    <main className="public-home" ref={rootRef}>
      <header className={`public-header ${isScrolled ? 'is-scrolled' : ''} ${isHeaderHidden ? 'is-hidden' : ''}`}>
        <a className="public-brand" href="#accueil" onClick={() => goToSection('accueil')}>
          <img src="/images/logo.png" alt={`Logo ${SITE_INFO.name}`} />
          <span>
            <strong>{SITE_INFO.name}</strong>
            <small>{SITE_INFO.location.city}, {SITE_INFO.location.country}</small>
          </span>
        </a>

        <button
          className="public-menu-button"
          type="button"
          aria-label="Ouvrir le menu"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`public-nav ${isMenuOpen ? 'is-open' : ''}`} aria-label="Navigation principale">
          <button type="button" onClick={() => goToSection('mission')}>Mission</button>
          <button type="button" onClick={() => goToSection('services')}>Services</button>
          <button type="button" onClick={() => goToSection('aider')}>Aider</button>
          <button type="button" onClick={() => goToSection('actualites')}>Actualités</button>
          <button type="button" onClick={() => goToSection('contact')}>Contact</button>
          <button className="public-nav-login" type="button" onClick={() => navigate('/login')}>
            Espace équipe
          </button>
        </nav>
      </header>

      {isMenuOpen && <button className="public-menu-backdrop" type="button" aria-label="Fermer le menu" onClick={() => setIsMenuOpen(false)} />}

      <section id="accueil" className="public-hero">
        <div className="public-hero-media" aria-hidden="true" ref={heroMediaRef}>
          <img src="/images/hero-background.jpg" alt="" />
        </div>
        <div className="public-hero-shade" aria-hidden="true" />
        <motion.div
          className="public-hero-content"
          initial={prefersReducedMotion ? false : 'hidden'}
          animate="visible"
          variants={{
            hidden: { opacity: 1 },
            visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.15 } }
          }}
        >
          <motion.p
            className="public-kicker"
            variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } } }}
          >
            Solidarité locale à Casablanca
          </motion.p>
          <motion.h1
            variants={{ hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.2, 0.7, 0.2, 1] } } }}
          >
            {SITE_INFO.heroTagline}
          </motion.h1>
          <motion.p
            className="public-hero-copy"
            variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } } }}
          >
            {SITE_INFO.story.summaryFr}
          </motion.p>
          <motion.div
            className="public-hero-actions"
            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } } }}
          >
            <motion.button
              whileHover={prefersReducedMotion ? undefined : { y: -2, scale: 1.02 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 360, damping: 22 }}
              className="public-primary-button"
              type="button"
              onClick={() => navigate('/don')}
            >
              Faire un don en nature
            </motion.button>
            <motion.button
              whileHover={prefersReducedMotion ? undefined : { y: -2 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 360, damping: 22 }}
              className="public-secondary-button"
              type="button"
              onClick={() => goToSection('contact')}
            >
              Contacter l'association
            </motion.button>
          </motion.div>
        </motion.div>
        <motion.aside
          className="public-hero-panel"
          aria-label="Impact de l'association"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 32, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1], delay: 0.35 }}
        >
          <motion.img
            src="/images/logo.png"
            alt=""
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.85, rotate: -4 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.1, ease: [0.2, 0.7, 0.2, 1], delay: 0.5 }}
          />
          <p>{SITE_INFO.nameAr}</p>
          <div className="public-hero-stats">
            {impactStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={prefersReducedMotion ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.7 + i * 0.1 }}
              >
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.aside>
      </section>

      <section id="mission" className="public-section public-mission">
        <div className="public-section-heading">
          <p>Notre mission</p>
          <h2>Protéger, accompagner, reconstruire.</h2>
        </div>
        <div className="public-mission-grid">
          <article>
            <span>01</span>
            <h3>Un accueil digne</h3>
            <p>
              Le centre accueille des personnes en grande précarité avec une attention portée à la sécurité,
              à la stabilité et au respect de chaque parcours.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>Une coordination locale</h3>
            <p>
              L'association agit en coordination avec les autorités locales et les partenaires de terrain
              pour assurer une réponse concrète aux besoins.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>Une seconde chance</h3>
            <p>
              Au-delà de l'urgence, l'objectif est d'aider chacun à retrouver confiance, autonomie et lien social.
            </p>
          </article>
        </div>
      </section>

      <section id="services" className="public-section public-services">
        <div className="public-section-heading public-section-heading-light">
          <p>Domaines d'action</p>
          <h2>Des services essentiels, portés par une présence humaine.</h2>
        </div>
        <div className="public-services-grid">
          {services.map((service) => (
            <article key={service.label}>
              <h3>{service.label}</h3>
              <p>{service.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="aider" className="public-section public-help">
        <div className="public-help-content">
          <div className="public-section-heading">
            <p>Comment aider</p>
            <h2>Les dons utiles sont souvent les plus simples.</h2>
          </div>
          <p>
            L'association privilégie les dons en nature et les soutiens concrets. Avant tout dépôt,
            contactez l'équipe afin d'organiser la réception selon les besoins du moment.
          </p>
          <button className="public-primary-button" type="button" onClick={() => navigate('/don')}>
            Voir les besoins prioritaires
          </button>
        </div>
        <ul className="public-help-list">
          {helpWays.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section id="actualites" className="public-section public-news">
        <div className="public-section-heading">
          <p>Actualités</p>
          <h2>Les actions récentes de l'association.</h2>
        </div>
        <div className="public-news-grid">
          {newsItems.map((item) => (
            <article key={item._id || item.id}>
              <img src={item.image || '/images/hero-background.jpg'} alt={item.title} />
              <div>
                <time>{formatDateFr(item.date)}</time>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="contact" className="public-section public-contact">
        <div className="public-contact-card">
          <div>
            <div className="public-section-heading public-section-heading-light">
              <p>Contact</p>
              <h2>Coordonner un don, un partenariat ou une demande d'information.</h2>
            </div>
            <dl className="public-contact-list">
              <div>
                <dt>Téléphone</dt>
                <dd><a href={`tel:${SITE_INFO.contact.emergencyPhone}`}>{SITE_INFO.contact.emergencyPhone}</a></dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd><a href={`mailto:${SITE_INFO.contact.email}`}>{SITE_INFO.contact.email}</a></dd>
              </div>
              <div>
                <dt>Adresse</dt>
                <dd>{SITE_INFO.contact.addressLines.join(', ')}</dd>
              </div>
              <div>
                <dt>Horaires</dt>
                <dd>{SITE_INFO.contact.hoursLines.join(' - ')}</dd>
              </div>
            </dl>
            <a className="public-map-link" href={SITE_INFO.contact.googleMapsUrl} target="_blank" rel="noreferrer">
              Ouvrir la localisation
            </a>
          </div>

          <form ref={formRef} className="public-contact-form" onSubmit={handleSubmit}>
            <label>
              Nom complet
              <input name="nom" value={formData.nom} onChange={handleInputChange} required />
            </label>
            <label>
              Email
              <input name="email" type="email" value={formData.email} onChange={handleInputChange} required />
            </label>
            <label>
              Telephone
              <input name="telephone" value={formData.telephone} onChange={handleInputChange} />
            </label>
            <label>
              Message
              <textarea name="message" rows="5" value={formData.message} onChange={handleInputChange} required />
            </label>
            <button className="public-primary-button" type="submit">Envoyer par email</button>
          </form>
        </div>
      </section>

      <footer className="public-footer">
        <div>
          <img src="/images/logo.png" alt={`Logo ${SITE_INFO.name}`} />
          <p>{SITE_INFO.name}</p>
        </div>
        <nav aria-label="Liens de pied de page">
          <button type="button" onClick={() => goToSection('mission')}>Mission</button>
          <button type="button" onClick={() => goToSection('services')}>Services</button>
          <button type="button" onClick={() => navigate('/don')}>Don</button>
          <button type="button" onClick={() => navigate('/login')}>Connexion</button>
        </nav>
        <small>© {COPYRIGHT_YEAR} {SITE_INFO.name}. Tous droits réservés.</small>
      </footer>
    </main>
  )
}

export default HomePage
