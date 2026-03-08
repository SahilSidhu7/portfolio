import Navbar from './components/Navbar'
import Hero from './components/Hero'
import AboutIntro from './components/AboutIntro'
import Skills from './components/skills.jsx'
import Certificates from './components/Certificates'
import Projects from './components/Projects'
import About from './components/About'

function App() {

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 md:px-8 box-border">
        <Navbar />
        <Hero />
        <AboutIntro />
        <Skills />
        <Certificates />
        <Projects />
      </main>
      <div className="w-full max-w-6xl mx-auto px-6 md:px-8 box-border">
        <About />
      </div>
    </div>
  )
}

export default App
