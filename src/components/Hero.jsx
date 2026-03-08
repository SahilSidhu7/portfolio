import React from 'react'
import me from "../assets/Me.png"

function Hero() {
  return (
    <div id='me' className='flex flex-col md:flex-row justify-between items-center px-6 py-12 pt-24 pb-12 gap-8 md:gap-0'>
      <div className='flex flex-col gap-4 max-w-xl order-2 md:order-1'>
        <p className='text-accent font-medium'>A software engineer</p>
        <h1 className='text-4xl md:text-5xl font-bold text-white'>Hello, I'm Sahilpreet Singh Sidhu</h1>
        <p className='text-muted'>I'm a software engineer with a passion for web applications and AI.</p>
        <a 
          href='https://github.com/SahilSidhu7/Me/blob/main/SahilSidhu.pdf'
          target="_blank">
        <button className='bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-lg font-medium transition-colors w-fit' >Open Resume</button>
        </a>
      </div>
      <div className='relative flex items-center justify-center order-1 md:order-2'>
        <div className='pointer-events-none absolute h-64 w-64 md:h-72 md:w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(167,139,250,0.55),rgba(76,29,149,0.05),transparent_70%)] blur-3xl' />
        <div className='relative h-52 w-52 md:h-64 md:w-64 rounded-full overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(139,92,246,0.55)]'>
          <img src={me} alt="hero" className='w-full h-full object-cover' />
        </div>
      </div>
    </div>
  )
}

export default Hero
