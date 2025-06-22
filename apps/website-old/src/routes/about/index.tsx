import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { SocialLinks } from '@/components/social-links'
import { TerminalPath } from '@/components/terminal-path'
import { BadgeInfoIcon, BriefcaseIcon, Code2Icon, LayersIcon, SparklesIcon, CodeIcon } from 'lucide-react'

type Job = {
  id: number
  company: string
  position: string
  period: string
  location: string
  description: string
  skills: string[]
  color: string
  logo: string
}

export default function AboutPage() {
  const [activeJob, setActiveJob] = useState<number | null>(1)

  const jobs: Job[] = [
    {
      id: 1,
      company: "Goldman Sachs",
      position: "Vice President - Cloud Development",
      period: "September 2022 - Present",
      location: "Dallas, Texas",
      description: "Building internal tooling and libraries that help developers deploy to the cloud efficiently. Leading cloud architecture and platform engineering initiatives for critical financial systems. Designing & building cool stuff in the cloud.",
      skills: ["AWS", "TypeScript", "Go", "CDK", "Nix", "Solution Architecture", "Cloud Infrastructure", "System Design"],
      color: "from-purple-600 to-purple-400",
      logo: "gs-logo"
    },
    {
      id: 2,
      company: "Capital Group",
      position: "Software Engineer III",
      period: "November 2018 - September 2022",
      location: "Denver, Colorado / Irvine, California",
      description: "Designed and built cloud-based external applications enabling advisors, sponsors and third-party administrators to digitally manage retirement plans. Built and maintained developer tools and infrastructure to improve product development workflows.",
      skills: ["AWS", "TypeScript", "Go", "Kubernetes", "Terraform", "Solution Architecture", "Cloud Infrastructure", "System Design"],
      color: "from-purple-500 to-indigo-500",
      logo: "cg-logo"
    },
    {
      id: 3,
      company: "Viasat",
      position: "Software Engineer",
      period: "May 2017 - November 2018",
      location: "Denver, Colorado",
      description: "Built some stuff.",
      skills: ["Java 8", "AWS", "JavaScript", "JAX-WS", "Spring", "Maven", "Tomcat", "Oracle", "OSA"],
      color: "from-emerald-500 to-teal-400",
      logo: "viasat-logo"
    }
  ]

  return (
    <main className="max-w-3xl mx-auto px-4 pt-16 pb-12 flex-1">
        <SocialLinks />
        
        {/* Terminal-style path indicator */}
        <div className="max-w-2xl mx-auto mb-5 text-center">
          <TerminalPath 
            path={[
              { 
                name: 'about', 
                href: '/about', 
                color: 'text-purple-500 dark:text-purple-400' 
              }
            ]} 
            filename="" 
          />
        </div>
        
        {/* About Me Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <BadgeInfoIcon className="mr-2 h-5 w-5 text-purple-500" />
            About Me
          </h2>
          
          <div className="bg-card rounded-lg border p-6 shadow-sm">
            <p className="leading-relaxed mb-4">
              I'm a software engineer with a passion for building cloud infrastructure, developer tools, and systems that solve complex problems.
              With experience at major financial and technology companies, I focus on creating elegant solutions that improve developer experiences
              and enable teams to build better software, faster.
            </p>
            <p className="leading-relaxed mb-4">
              Outside of work, I'm raising a little one, experimenting with new technologies in my homelab, and occasionally 
              writing about my findings. I'm particularly fascinated by serverless architectures, minimizing server management,
              and making cloud complexity more accessible through better developer tooling.
            </p>
            <p className="text-sm mt-4">
              <Link
                to="/posts"
                search={{category: undefined, sort: undefined, order: undefined}}
                className="inline-flex items-center text-purple-500 hover:text-purple-600 transition-colors"
              >
                Read my blog posts
                <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </p>
          </div>
        </section>
        
        {/* My Interests Section */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <SparklesIcon className="mr-2 h-5 w-5 text-indigo-500" />
            My Interests
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card/50 rounded-lg border p-5 flex flex-col items-center text-center hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-3">
                <Code2Icon className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="font-medium mb-2">Developer Tools</h3>
              <p className="text-sm text-muted-foreground">Creating tools that improve workflow efficiency</p>
            </div>
            
            <div className="bg-card/50 rounded-lg border p-5 flex flex-col items-center text-center hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-blue-500">
                  <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                  <line x1="12" y1="6" x2="12" y2="10"></line>
                  <line x1="12" y1="14" x2="12" y2="18"></line>
                  <line x1="8" y1="6" x2="8" y2="8"></line>
                  <line x1="16" y1="6" x2="16" y2="8"></line>
                  <line x1="8" y1="14" x2="8" y2="16"></line>
                  <line x1="16" y1="14" x2="16" y2="16"></line>
                </svg>
              </div>
              <h3 className="font-medium mb-2">Homelab</h3>
              <p className="text-sm text-muted-foreground">Building and experimenting with servers and networks</p>
            </div>
            
            <div className="bg-card/50 rounded-lg border p-5 flex flex-col items-center text-center hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                <LayersIcon className="h-6 w-6 text-emerald-500" />
              </div>
              <h3 className="font-medium mb-2">Cloud Infrastructure</h3>
              <p className="text-sm text-muted-foreground">Building scalable, resilient systems in the cloud</p>
            </div>
          </div>
        </section>
        
        {/* Experience Timeline */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold mb-8 flex items-center">
            <BriefcaseIcon className="mr-2 h-5 w-5 text-orange-500" />
            Work Experience
          </h2>
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* Timeline Navigation */}
            <div className="md:w-1/3">
              <div className="relative">
                {jobs.map((job, index) => (
                  <div key={job.id} className="mb-8 last:mb-0">
                    <button
                      onClick={() => setActiveJob(job.id)}
                      className={`flex w-full items-start text-left transition-all ${
                        activeJob === job.id 
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground/80"
                      }`}
                    >
                      {/* Timeline line */}
                      {index < jobs.length - 1 && (
                        <div className={`absolute left-2.5 top-5 h-full w-0.5 bg-border ${
                          activeJob === job.id ? "opacity-100" : "opacity-60"
                        }`} />
                      )}
                      
                      {/* Timeline dot */}
                      <div className={`mr-4 h-5 w-5 rounded-full border ${
                        activeJob === job.id 
                          ? `bg-gradient-to-r ${job.color}`
                          : "bg-background"
                      }`} />
                      
                      <div>
                        <div className={`font-medium ${
                          activeJob === job.id ? "" : "text-muted-foreground"
                        }`}>{job.company}</div>
                        <div className="text-sm text-muted-foreground">
                          {job.period}
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Job Details */}
            <div className="md:w-2/3">
              {activeJob && (
                <div className="space-y-4 rounded-lg border bg-card p-6 shadow-sm transition-all">
                  {jobs
                    .filter(job => job.id === activeJob)
                    .map(job => (
                      <div key={job.id}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold">{job.position}</h3>
                            <p className="text-sm text-muted-foreground">
                              {job.company} · {job.period}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {job.location}
                            </p>
                          </div>
                          <div className={`w-12 h-12 rounded-md bg-gradient-to-br ${job.color} bg-opacity-10 flex items-center justify-center shadow-sm`}>
                            <div className="text-white font-bold text-xs">
                              {job.company.split(' ').map(word => word[0]).join('')}
                            </div>
                          </div>
                        </div>
                        
                        <p className="mb-4 leading-relaxed">{job.description}</p>
                        
                        <div className="flex flex-wrap gap-2">
                          {job.skills.map(skill => (
                            <span 
                              key={skill} 
                              className={`inline-flex items-center rounded-md bg-gradient-to-r ${job.color} bg-opacity-10 px-2 py-1 text-xs font-medium text-white`}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          </div>
        </section>
        
        {/* Pet Projects */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <CodeIcon className="mr-2 h-5 w-5 text-pink-500" />
            Projects
          </h2>
          
          <div className="grid grid-cols-1 gap-4">
            <a 
              href="https://github.com/dsqr-dev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block bg-card rounded-lg border p-5 hover:shadow-sm hover:border-purple-200 dark:hover:border-purple-800/50 transition-all"
            >
              <h3 className="font-medium mb-1 flex items-center">
                <span className="text-purple-500 mr-2">dsqr</span>
              </h3>
              <p className="text-sm text-muted-foreground">
                A collection of developer tools for application development, content creation, and homelab management. Built for my own needs but shared publicly.
              </p>
            </a>
            
            <a 
              href="https://tcg-price-guide.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block bg-card rounded-lg border p-5 hover:shadow-sm hover:border-blue-200 dark:hover:border-blue-800/50 transition-all"
            >
              <h3 className="font-medium mb-1 flex items-center">
                <span className="text-blue-500 mr-2">TCG Price Guide</span>
              </h3>
              <p className="text-sm text-muted-foreground">
                A tool for quickly searching the value of TCG cards. Simple interface designed to get accurate pricing information with minimal friction.
              </p>
            </a>
          </div>
        </section>
        
        {/* Contact info */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Want to work together? Feel free to reach out.</p>
        </div>
      </main>
  )
}