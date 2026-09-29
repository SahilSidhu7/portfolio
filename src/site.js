import resumePdf from './assets/Sahilpreet-Singh-Sidhu-Resume.pdf'

export const PROFILE = {
  name: 'Sahilpreet Singh Sidhu',
  first: 'Sahilpreet',
  last: 'Sidhu',
  location: 'Barnala, India',
  email: 'sahilsidhu3127@gmail.com',
  github: 'https://github.com/SahilSidhu7',
  linkedin: 'https://www.linkedin.com/in/sahil-sidhu-ai/',
  resume: resumePdf,
  cgpa: '9.27',
}

export const SECTIONS = [
  { id: 'projects', label: 'Projects' },
  { id: 'papers', label: 'Papers' },
  { id: 'skills', label: 'Skills' },
  { id: 'contact', label: 'Contact' },
]

export const scrollToSection = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
