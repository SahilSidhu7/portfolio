export default function AboutIntro({ profile }) {
  return (
    <section className="grid gap-5 pt-16 md:grid-cols-[3fr_2fr] md:pt-24">
      <div className="corner rounded-[26px] bg-white p-7 md:p-10">
        <p className="text-sm font-semibold text-peri">About</p>
        <h2 className="wide mt-3 text-3xl font-extrabold leading-[1.05] tracking-tight md:text-[2.6rem]">
          I learn by shipping the whole thing.
        </h2>
        {profile.bio_paragraphs.map((paragraph, i) => (
          <p key={i} className="mt-4 leading-relaxed text-mute">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="grid gap-5">
        <div className="corner rounded-[26px] bg-coal p-7 text-paper md:p-8">
          <h3 className="text-sm font-semibold text-amber">Now</h3>
          <ul className="mt-4 space-y-3">
            {profile.currently_building.map((line, i) => (
              <li key={i} className="flex gap-3 leading-snug">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" aria-hidden />
                {line}
              </li>
            ))}
          </ul>
        </div>
        <div className="corner rounded-[26px] bg-blush/70 p-7 md:p-8">
          <h3 className="text-sm font-semibold text-coal/70">How I work</h3>
          <ul className="mt-4 space-y-2 font-medium">
            <li>End to end: data, backend, frontend, deploy</li>
            <li>Measure it, then write down what failed</li>
            <li>Local-first AI: private, cheap, always on</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
