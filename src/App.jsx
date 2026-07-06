import Navbar from './components/Navbar'
import Hero from './components/Hero'
import AboutIntro from './components/AboutIntro'
import Skills from './components/skills.jsx'
import Certificates from './components/Certificates'
import Projects from './components/Projects'
import About from './components/About'
import AdminApp from './admin/AdminApp.jsx'

function App() {
  if (typeof window !== 'undefined' && window.location.pathname === '/admin') {
    return <AdminApp />
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-6 md:px-8">
        <Hero />
        <AboutIntro />
        <Projects />
        <Skills />
        <Certificates />
        <About />
      </main>
    </div>
  )
}

export default App
