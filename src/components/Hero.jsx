import me from '../assets/Me.png'
import { PROFILE, scrollToSection } from '../site.js'

function Badge() {
  return (
    <div className="relative h-24 w-24 shrink-0 rounded-full bg-coal text-paper md:h-28 md:w-28" aria-hidden>
      <svg viewBox="0 0 100 100" className="spin-slow absolute inset-0 h-full w-full">
        <defs>
          <path id="badge-ring" d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0" />
        </defs>
        <text className="fill-current font-mono" fontSize="9.2" letterSpacing="2.6">
          <textPath href="#badge-ring">AI ENGINEER · 2026 · PORTFOLIO ·</textPath>
        </text>
      </svg>
      <span className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper" />
    </div>
  )
}

function ProfileCard({ profile }) {
  return (
    <div className="rise relative flex h-full flex-col">
      <div className="relative h-[52px]">
        <span className="absolute left-1 top-3 flex items-center gap-2 text-sm font-semibold text-coal">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <circle cx="12" cy="6.5" r="3" />
            <circle cx="12" cy="17.5" r="3" />
            <circle cx="6.5" cy="12" r="3" />
            <circle cx="17.5" cy="12" r="3" />
          </svg>
          About Me
        </span>
        <div className="folder-tab absolute bottom-0 right-0 h-full w-[64%] rounded-tr-[26px] bg-peri" />
      </div>

      <div className="relative flex min-h-[520px] flex-1 flex-col justify-end overflow-hidden rounded-[26px] rounded-tr-none bg-peri p-6 text-white md:p-8">
        <div className="absolute right-5 top-4 w-[62%] max-w-[300px] md:right-8">
          <div className="aspect-square rounded-full bg-blush p-2 ring-[7px] ring-white/95">
            <img
              src={me}
              alt={PROFILE.name}
              className="h-full w-full rounded-full object-cover"
            />
          </div>
        </div>

        <div className="relative">
          <p className="wide text-5xl font-light leading-none md:text-6xl">I&apos;m,</p>
          <h1 className="wide mt-2 text-[2.6rem] font-bold leading-[1.02] tracking-tight sm:text-5xl md:text-[3.4rem]">
            {PROFILE.first}
            <br />
            {PROFILE.last}
          </h1>
          <p className="mt-3 max-w-[16rem] text-sm font-medium text-white/85">{profile.hero_tagline}</p>

          <div className="mt-6 flex items-end justify-between gap-4">
            <a
              href={`mailto:${PROFILE.email}`}
              className="dashed-link inline-flex min-w-0 items-center gap-2 text-sm font-medium text-white"
            >
              <span className="truncate">{PROFILE.email}</span>
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M4 13h4l1.5 2.5h5L16 13h4" />
                <path d="M5.5 6h13l1.5 7v5H4v-5z" strokeLinejoin="round" />
              </svg>
            </a>
            <Badge />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatTile({ value, label, className, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`corner flex min-h-[130px] min-w-0 cursor-pointer flex-col justify-end rounded-[22px] p-5 text-left transition-transform hover:-translate-y-0.5 md:p-6 ${className}`}
    >
      <span className="wide text-4xl font-extrabold leading-none md:text-[2.6rem]">{value}</span>
      <span className="mt-2 text-base md:text-lg">{label}</span>
    </button>
  )
}

function FeaturedTile({ projects }) {
  const featured = (projects || []).find((p) => p.image_url)
  return (
    <button
      type="button"
      onClick={() => scrollToSection('projects')}
      className="corner group relative col-span-2 min-h-[240px] cursor-pointer overflow-hidden rounded-[22px] bg-mint text-left text-white md:min-h-[300px]"
    >
      {featured ? (
        <img
          src={featured.image_url}
          alt={`${featured.title} screenshot`}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#f1b6fb,transparent_55%),radial-gradient(circle_at_75%_70%,#8286d8,transparent_55%)]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/5" />
      <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-coal shadow-lg transition-transform group-hover:scale-110">
        <svg className="ml-0.5 h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M8 5.5v13l10.5-6.5z" />
        </svg>
      </span>
      <span className="absolute bottom-5 left-5 right-5">
        <span className="inline-block rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-coal">Featured build</span>
        <span className="mt-2 block text-lg font-semibold">{featured ? featured.title : 'Selected projects'}</span>
      </span>
    </button>
  )
}

export default function Hero({ profile, projects, papers }) {
  const projectCount = projects ? projects.length : '—'
  const paperCount = papers ? papers.length : 0

  return (
    <section id="me" className="grid gap-6 pt-6 md:pt-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-8">
      <ProfileCard profile={profile} />

      <div className="flex flex-col gap-5">
        <div className="rise rise-1 relative pr-6">
          <h2 className="wide text-[3.4rem] font-black leading-[0.9] tracking-[-0.02em] sm:text-7xl xl:text-[7.2rem]">
            Portfolio
          </h2>
          <span className="absolute right-0 top-1 h-6 w-6 border-r-[5px] border-t-[5px] border-coal md:h-8 md:w-8" aria-hidden />
          <p className="mt-4 max-w-xl text-base leading-relaxed text-mute">{profile.hero_subtext}</p>
        </div>

        <div className="rise rise-2 grid flex-1 grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5">
          <FeaturedTile projects={projects} />
          <div className="col-span-2 grid grid-cols-2 gap-4 sm:col-span-1 sm:grid-cols-1 md:gap-5">
            <StatTile
              value={projectCount}
              label="Projects"
              className="bg-mint text-coal"
              onClick={() => scrollToSection('projects')}
            />
            <StatTile
              value={PROFILE.cgpa}
              label="CGPA"
              className="bg-violet text-white"
              onClick={() => scrollToSection('credentials')}
            />
          </div>

          <a
            href={PROFILE.github}
            target="_blank"
            rel="noopener noreferrer"
            className="corner col-span-2 flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-[22px] bg-graphite sm:col-span-1 sm:min-h-[150px] text-white transition-transform hover:-translate-y-0.5 md:min-h-[180px]"
          >
            <svg className="h-9 w-9" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-lg">GitHub</span>
          </a>

          <button
            type="button"
            onClick={() => scrollToSection(paperCount ? 'papers' : 'credentials')}
            className="col-span-2 grid cursor-pointer grid-cols-[2fr_3fr] overflow-hidden rounded-[22px] text-left transition-transform hover:-translate-y-0.5"
          >
            <span className="flex items-center justify-center bg-coal">
              <span
                className="h-16 w-16 rounded-full shadow-[inset_-8px_-10px_18px_rgba(0,0,0,0.45)] md:h-24 md:w-24"
                style={{
                  background:
                    'repeating-radial-gradient(circle at 70% 25%, #f1b6fb 0 6px, #8286d8 6px 12px, #a9dcd4 12px 16px)',
                }}
                aria-hidden
              />
            </span>
            <span className="corner flex flex-col justify-end bg-amber p-5 text-coal md:p-6">
              {paperCount ? (
                <>
                  <span className="wide text-4xl font-extrabold leading-none md:text-[2.6rem]">{paperCount}</span>
                  <span className="mt-2 text-sm leading-snug md:text-base">
                    Papers &amp;
                    <br />
                    findings.
                  </span>
                </>
              ) : (
                <>
                  <span className="wide text-4xl font-extrabold leading-none md:text-[2.6rem]">3</span>
                  <span className="mt-2 text-sm leading-snug md:text-base">
                    Microsoft Azure
                    <br />
                    certifications.
                  </span>
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </section>
  )
}
