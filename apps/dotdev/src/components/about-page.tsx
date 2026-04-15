"use client"

import { Link } from "@tanstack/react-router"
import { motion } from "framer-motion"
import {
  Award,
  Briefcase,
  Cloud,
  ExternalLink,
  Github,
  GraduationCap,
  Linkedin,
  Mail,
  MapPin,
  Terminal,
} from "lucide-react"

const profile = {
  name: "TODO",
  handle: "TODO",
  title: "TODO",
  company: "TODO",
  location: "TODO",
  summary: "TODO",
  image: "/me.jpeg",
  links: {
    github: "https://github.com/TODO",
    linkedin: "https://linkedin.com/in/TODO",
    email: "mailto:TODO",
  },
}

const experience = [
  {
    company: "TODO",
    location: "TODO",
    logo: "TODO",
    roles: [
      {
        title: "TODO",
        team: "TODO",
        period: "TODO",
        highlights: ["TODO"],
      },
    ],
  },
]

const projects = [
  {
    name: "TODO",
    description: "TODO",
    link: "https://github.com/TODO",
    tags: ["TODO"],
  },
]

const patent = {
  title: "TODO",
  number: "TODO",
}

const certifications = [{ name: "TODO" }]

const skills = {
  languages: ["TODO"],
  cloud: ["TODO"],
  frameworks: ["TODO"],
  infrastructure: ["TODO"],
  cicd: ["TODO"],
  frontend: ["TODO"],
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

function AboutPage() {
  return (
    <motion.div
      className="space-y-10 font-mono max-w-3xl mx-auto"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Hero Section */}
      <motion.section variants={item} className="flex gap-6 items-start">
        <div className="flex-shrink-0">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-border">
            <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold">{profile.name}</h1>
            <p className="text-sm text-muted-foreground">@{profile.handle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{profile.title}</span>
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{profile.company}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span>{profile.location}</span>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <a
              href={profile.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href={profile.links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a
              href={profile.links.email}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>
      </motion.section>

      {/* Summary */}
      <motion.section variants={item}>
        <p className="text-sm leading-relaxed text-muted-foreground">{profile.summary}</p>
      </motion.section>

      {/* Experience - LinkedIn Style */}
      <motion.section variants={item} className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <Briefcase className="w-4 h-4" />
          <h2 className="font-semibold">Experience</h2>
        </div>

        <div className="space-y-6">
          {experience.map((exp) => (
            <div key={exp.company} className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                {exp.logo}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between">
                  <h3 className="font-medium">{exp.company}</h3>
                  <span className="text-xs text-muted-foreground">{exp.location}</span>
                </div>

                {exp.roles.map((role) => (
                  <div key={role.title} className="space-y-2">
                    <div>
                      <p className="text-sm">{role.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {role.team} · {role.period}
                      </p>
                    </div>
                    <ul className="space-y-1">
                      {role.highlights.map((highlight) => (
                        <li key={highlight} className="text-xs text-muted-foreground flex gap-2">
                          <span className="text-primary mt-1">•</span>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Projects */}
      <motion.section variants={item} className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <Terminal className="w-4 h-4" />
          <h2 className="font-semibold">Projects</h2>
        </div>

        <div className="grid gap-3">
          {projects.map((project) => (
            <a
              key={project.name}
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start justify-between gap-4 p-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="space-y-1">
                <h3 className="text-sm font-medium group-hover:text-primary transition-colors">
                  {project.name}
                </h3>
                <p className="text-xs text-muted-foreground">{project.description}</p>
                <div className="flex gap-2 pt-1">
                  {project.tags.map((tag) => (
                    <span key={tag} className="text-[10px] text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
            </a>
          ))}
        </div>
      </motion.section>

      {/* Education */}
      <motion.section variants={item} className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <GraduationCap className="w-4 h-4" />
          <h2 className="font-semibold">Education</h2>
        </div>

        <div className="flex gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
            TODO
          </div>
          <div>
            <h3 className="font-medium">TODO</h3>
            <p className="text-sm text-muted-foreground">TODO</p>
            <p className="text-xs text-muted-foreground">TODO</p>
          </div>
        </div>
      </motion.section>

      {/* Certifications & Patent */}
      <motion.section variants={item} className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <Award className="w-4 h-4" />
          <h2 className="font-semibold">Licenses & Certifications</h2>
        </div>

        <div className="space-y-3">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
              USPTO
            </div>
            <div>
              <h3 className="font-medium text-sm">{patent.title}</h3>
              <p className="text-xs text-muted-foreground">Patent Pending · {patent.number}</p>
            </div>
          </div>

          {certifications.map((cert) => (
            <div key={cert.name} className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                AWS
              </div>
              <div>
                <h3 className="font-medium text-sm">{cert.name}</h3>
                <p className="text-xs text-muted-foreground">Amazon Web Services</p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Skills */}
      <motion.section variants={item} className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <h2 className="font-semibold">Skills</h2>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <span className="text-muted-foreground">Languages: </span>
            <span>{skills.languages.join(", ")}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Cloud (AWS): </span>
            <span>{skills.cloud.join(", ")}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Frameworks: </span>
            <span>{skills.frameworks.join(", ")}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Infrastructure: </span>
            <span>{skills.infrastructure.join(", ")}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Build / CI/CD: </span>
            <span>{skills.cicd.join(", ")}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Frontend: </span>
            <span>{skills.frontend.join(", ")}</span>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.section variants={item} className="border-t border-border pt-6 text-center space-y-2">
        <p className="text-xs text-muted-foreground">TODO</p>
        <div className="flex items-center justify-center gap-3 text-xs">
          <Link to="/posts" className="text-primary hover:underline underline-offset-4">
            Read my posts
          </Link>
          <span className="text-muted-foreground">·</span>
          <a href={profile.links.email} className="text-primary hover:underline underline-offset-4">
            Get in touch
          </a>
        </div>
      </motion.section>
    </motion.div>
  )
}

export { AboutPage }
