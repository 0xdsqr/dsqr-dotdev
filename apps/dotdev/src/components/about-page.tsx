"use client"

import { Link } from "@tanstack/react-router"
import { motion } from "framer-motion"
import {
  Award,
  Briefcase,
  Cloud,
  Code2,
  ExternalLink,
  Github,
  GraduationCap,
  Heart,
  Linkedin,
  Mail,
  MapPin,
  Terminal,
} from "lucide-react"

// Mock data - fill these in!
const profile = {
  name: "David Dennis",
  handle: "0xdsqr",
  title: "Vice President - Software Engineer",
  company: "Goldman Sachs",
  team: "Cloud Platform",
  location: "Dallas, Texas",
  bio: "Dad of one. Building cloud platforms and developer tools. Interested in distributed systems, serverless architectures, and making infrastructure feel like magic.",
  image: "/me.jpeg",
  links: {
    github: "https://github.com/0xdsqr",
    linkedin: "https://linkedin.com/in/davedennis93",
    email: "mailto:hello@dsqr.dev",
    website: "https://dsqr.dev",
  },
}

const skills = [
  { name: "TypeScript", category: "language" },
  { name: "AWS", category: "cloud" },
  { name: "Distributed Systems", category: "architecture" },
  { name: "Serverless", category: "architecture" },
  { name: "Nix", category: "tooling" },
  { name: "DynamoDB", category: "database" },
  { name: "CDK", category: "infrastructure" },
  { name: "Node.js", category: "runtime" },
]

const experience = [
  {
    company: "Goldman Sachs",
    roles: [
      {
        title: "VP - Software Engineer, Cloud Platform",
        period: "Nov 2023 - Present",
        description:
          "Enabling others to design & build cool stuff in the cloud.",
      },
      {
        title: "VP - Software Engineer, GS Innovation Center",
        period: "Sep 2022 - Nov 2023",
        description: "1x patent for cloud platform architecture.",
      },
    ],
  },
  {
    company: "Capital Group",
    roles: [
      {
        title: "Software Engineer III",
        period: "Sep 2020 - Sep 2022",
        description:
          "Built and scaled cloud platforms powering retirement plan services.",
      },
    ],
  },
  {
    company: "Viasat",
    roles: [
      {
        title: "Software Engineer",
        period: "May 2017 - Nov 2018",
        description:
          "Built cool stuff in the cloud. Also built cool stuff not in the cloud.",
      },
    ],
  },
]

const projects = [
  {
    name: "durable-lambda",
    description:
      "Actor-based state management for AWS Lambda. Single-instance guarantees, distributed locking, and persistent state.",
    link: "https://github.com/0xdsqr/durable-lambda",
    tags: ["AWS", "TypeScript", "DynamoDB"],
  },
  {
    name: "dodo",
    description:
      "A modern DynamoDB toolkit built on functional patterns, Zod validation, and clean, type-safe CRUD.",
    link: "https://github.com/0xdsqr/dodo",
    tags: ["TypeScript", "DynamoDB", "Zod"],
  },
  {
    name: "typescript-go-overlay",
    description:
      "Nix flake for the TypeScript Go compiler with nightly builds.",
    link: "https://github.com/0xdsqr/typescript-go-overlay",
    tags: ["Nix", "TypeScript"],
  },
]

const certifications = [
  {
    name: "AWS Solutions Architect – Professional",
    issuer: "AWS",
    year: "2023",
  },
  { name: "AWS DevOps Engineer – Professional", issuer: "AWS", year: "2023" },
]

const funFacts = [
  "Became a dad and immediately made a parenthood exception joke",
  "Built a TCG card value checker during paternity leave",
  "Thinks Nix can serve web content (and proved it)",
]

const categoryColors: Record<string, string> = {
  language:
    "text-teal-600 dark:text-teal-400 border-teal-600 dark:border-teal-400",
  cloud:
    "text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400",
  architecture:
    "text-emerald-600 dark:text-emerald-400 border-emerald-600 dark:border-emerald-400",
  tooling:
    "text-rose-600 dark:text-rose-400 border-rose-600 dark:border-rose-400",
  database:
    "text-amber-600 dark:text-amber-400 border-amber-600 dark:border-amber-400",
  infrastructure:
    "text-cyan-600 dark:text-cyan-400 border-cyan-600 dark:border-cyan-400",
  runtime:
    "text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400",
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

function AboutPage() {
  return (
    <motion.div
      className="space-y-12 font-mono"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Hero Section */}
      <motion.section
        variants={item}
        className="flex flex-col md:flex-row gap-8 items-start"
      >
        {/* Polaroid-style photo */}
        <div className="group">
          <div className="bg-card p-3 pb-12 border border-border rounded-sm shadow-sm rotate-[-2deg] hover:rotate-0 transition-transform duration-300">
            <div className="w-32 h-32 md:w-40 md:h-40 overflow-hidden bg-muted">
              <img
                src="/me.jpeg"
                alt={profile.name}
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              probably studying or
              <br />
              playing with my kid
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-medium">{profile.name}</h1>
            <p className="text-muted-foreground text-sm">@{profile.handle}</p>
          </div>

          <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm">
            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <Briefcase className="w-4 h-4" />
              <span className="border-b-2 border-dotted border-indigo-600 dark:border-indigo-400">
                {profile.title}
              </span>
            </span>
            <span className="text-muted-foreground">at</span>
            <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
              <Cloud className="w-4 h-4" />
              <span className="border-b-2 border-dotted border-teal-600 dark:border-teal-400">
                {profile.company}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{profile.location}</span>
          </div>

          <p className="text-sm leading-relaxed max-w-xl">{profile.bio}</p>

          {/* Social Links */}
          <div className="flex items-center gap-4 pt-2">
            <a
              href={profile.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href={profile.links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a
              href={profile.links.email}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Email"
            >
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>
      </motion.section>

      {/* Skills */}
      <motion.section variants={item} className="space-y-4">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-lg font-medium">Skills</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill.name}
              className={`text-xs px-2.5 py-1 rounded-sm border-b-2 border-dotted ${
                categoryColors[skill.category] ||
                "text-foreground border-border"
              }`}
            >
              {skill.name}
            </span>
          ))}
        </div>
      </motion.section>

      {/* Experience */}
      <motion.section variants={item} className="space-y-4">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-lg font-medium">Experience</h2>
        </div>
        <div className="space-y-6">
          {experience.map((exp, i) => (
            <div key={exp.company} className="relative">
              {/* Timeline line */}
              {i < experience.length - 1 && (
                <div className="absolute left-[5px] top-8 bottom-0 w-px bg-border" />
              )}

              <div className="flex gap-4">
                {/* Timeline dot */}
                <div className="w-3 h-3 rounded-full bg-muted-foreground/30 border-2 border-border mt-1.5 flex-shrink-0" />

                <div className="flex-1 space-y-3">
                  <h3 className="font-medium text-emerald-600 dark:text-emerald-400">
                    {exp.company}
                  </h3>
                  {exp.roles.map((role) => (
                    <div
                      key={role.title}
                      className="border border-border rounded-lg p-4 space-y-1"
                    >
                      <p className="text-sm font-medium">{role.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {role.period}
                      </p>
                      <p className="text-sm text-muted-foreground pt-1">
                        {role.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Projects */}
      <motion.section variants={item} className="space-y-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-lg font-medium">Projects</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <a
              key={project.name}
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group block border border-border rounded-lg p-4 hover:border-muted-foreground/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {project.name}
                </h3>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {project.description}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-1.5 py-0.5 bg-muted rounded-sm text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </a>
          ))}
        </div>
      </motion.section>

      {/* Certifications */}
      <motion.section variants={item} className="space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-lg font-medium">Certifications</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {certifications.map((cert) => (
            <div
              key={cert.name}
              className="border border-border rounded-lg px-4 py-3 text-sm"
            >
              <p className="font-medium">{cert.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {cert.issuer} · {cert.year}
              </p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Education */}
      <motion.section variants={item} className="space-y-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-lg font-medium">Education</h2>
        </div>
        <div className="border border-border rounded-lg p-4">
          <p className="font-medium">Colorado State University</p>
          <p className="text-sm text-muted-foreground">
            {"Bachelor's Degree, Computer Science"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">2013 – 2018</p>
        </div>
      </motion.section>

      {/* Fun Section */}
      <motion.section variants={item} className="space-y-4">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-lg font-medium">Fun Facts</h2>
        </div>
        <ul className="space-y-2">
          {funFacts.map((fact) => (
            <li
              key={fact}
              className="flex items-start gap-2 text-sm text-muted-foreground"
            >
              <span className="text-rose-600 dark:text-rose-400">→</span>
              <span>{fact}</span>
            </li>
          ))}
        </ul>
      </motion.section>

      {/* Footer CTA */}
      <motion.section
        variants={item}
        className="border-t border-border pt-8 text-center space-y-3"
      >
        <p className="text-sm text-muted-foreground">
          {
            "Want to chat? I'm always down to talk cloud, distributed systems, or dad jokes."
          }
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/"
            className="text-sm text-purple-600 dark:text-purple-400 border-b-2 border-dotted border-purple-600 dark:border-purple-400 hover:opacity-80 transition-opacity"
          >
            Read my posts
          </Link>
          <span className="text-muted-foreground">/</span>
          <a
            href={profile.links.email}
            className="text-sm text-purple-600 dark:text-purple-400 border-b-2 border-dotted border-purple-600 dark:border-purple-400 hover:opacity-80 transition-opacity"
          >
            Say hello
          </a>
        </div>
      </motion.section>
    </motion.div>
  )
}

export { AboutPage }
