import Navbar from './components/Navbar'
import Hero from './components/Hero'
import AboutIntro from './components/AboutIntro'
import Skills from './components/skills.jsx'
import Certificates from './components/Certificates'
import Projects from './components/Projects'
import About from './components/About'

function App() {
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
