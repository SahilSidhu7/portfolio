import React from 'react'

// Fill these with your real info
const PROFILE = {
  name: 'Sahilpreet Singh Sidhu',
  role: '',
  location: 'Barnala, India',
  email: 'sahilsidhu3127@gmail.com',
  github: 'https://github.com/SahilSidhu7',
  linkedin: 'https://www.linkedin.com/in/sahil-sidhu-ai/',
  twitter: '',
}

function About() {
  return (
    <footer id="contact" className="py-16 md:py-20 border-t border-white/10 text-sm text-muted">
      <div className="flex flex-col md:flex-row justify-between gap-10 md:gap-16">
        <div className="max-w-md">
          <p className="text-accent font-semibold mb-2">About</p>
          <h2 className="text-2xl font-bold text-white mb-3">
            {PROFILE.name}
          </h2>
          <p className="text-muted mb-2">
            {PROFILE.location}
          </p>
          <p className="text-muted/80">
            I enjoy building reliable web experiences, automating workflows, and
            working across the stack from frontend to backend and infrastructure.
          </p>
        </div>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h3 className="text-white font-semibold mb-3 text-xs tracking-[0.16em] uppercase">
              Contact
            </h3>
            <ul className="space-y-2">
              <li>
                <span className="text-muted/70 text-xs">Email</span>
                <div>
                  <a
                    href={`mailto:${PROFILE.email}`}
                    className="text-sm text-accent hover:text-accent-hover break-all"
                  >
                    {PROFILE.email}
                  </a>
                </div>
              </li>
              <li>
                <span className="text-muted/70 text-xs">GitHub</span>
                <div>
                  <a
                    href={PROFILE.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-accent hover:text-accent-hover"
                  >
                    {PROFILE.github.replace('https://', '')}
                  </a>
                </div>
              </li>
              <li>
                <span className="text-muted/70 text-xs">LinkedIn</span>
                <div>
                  <a
                    href={PROFILE.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-accent hover:text-accent-hover"
                  >
                    {PROFILE.linkedin.replace('https://', '')}
                  </a>
                </div>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3 text-xs tracking-[0.16em] uppercase">
              Links
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href={PROFILE.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:text-accent-hover"
                >
                  
                </a>
              </li>
              <li>
                <a href='https://github.com/SahilSidhu7/Me/blob/32d1b090b15ae19290742cb5db51109eca62d4c9/SahilpreetSinghSidhu.pdf'>
                <button
                  type="button"
                  className="mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors"
                >
                  Open resume
                </button>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mt-10 pt-6 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-muted/70">
        <span>
          © {new Date().getFullYear()} {PROFILE.name}. All rights reserved.
        </span>
        <span>Built with React, Vite, and Tailwind CSS.</span>
      </div>
    </footer>
  )
}

export default About
