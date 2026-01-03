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
  name: "David Dennis",
  handle: "0xdsqr",
  title: "Vice President, Software Engineer",
  company: "Goldman Sachs",
  location: "Dallas, Texas",
  summary:
    "10+ years of experience designing and building large-scale cloud platforms and developer tooling. Personally architected and built Reference Stack, the firm's Internal Developer Platform powering its cloud migration strategy. Deep hands-on expertise in AWS, TypeScript, Go, Nix, and developer workflows.",
  image: "/me.jpeg",
  links: {
    github: "https://github.com/0xdsqr",
    linkedin: "https://linkedin.com/in/davedennis93",
    email: "mailto:hello@dsqr.dev",
  },
}

const experience = [
  {
    company: "Goldman Sachs",
    location: "Dallas, TX",
    logo: "GS",
    roles: [
      {
        title: "Vice President, Software Engineer",
        team: "Cloud Platform",
        period: "Sep 2022 - Present",
        highlights: [
          "Architected and built Reference Stack, a TypeScript library of cloud patterns and constructs with a declarative YAML interface",
          "Tech lead for team of 5 engineers; drove adoption from 0% to 33% of firm applications in year one",
          "Built database migration tooling with custom DMS solutions for Sybase/DB2 to Aurora/DynamoDB migrations",
          "Built reusable CI/CD library for GitLab enabling standardized pipelines for npm, Go, and container builds",
          "Contributed upstream to AWS CDK, Nix, and other open source projects",
          "Architected cloud incubation system for validating new cloud-native platforms — now patent-pending",
        ],
      },
    ],
  },
  {
    company: "Capital Group",
    location: "Irvine, CA",
    logo: "CG",
    roles: [
      {
        title: "Software Engineer III",
        team: "Tech Lead",
        period: "Sep 2020 - Sep 2022",
        highlights: [
          "Built and scaled cloud platforms powering retirement plan management for Advisors, Sponsors, and TPAs",
          "Led architecture and development of internal back-office systems",
          "Led migration from legacy monolith to fully distributed microservices architecture",
        ],
      },
    ],
  },
  {
    company: "EY → KPMG",
    location: "Irvine, CA → Denver, CO",
    logo: "EY",
    roles: [
      {
        title: "Senior Associate → Associate",
        team: "Tech Lead",
        period: "Nov 2018 - Sep 2020",
        highlights: [
          "Led development team of 5 onshore + 4 offshore engineers for Capital Group Private Client Services",
          "Built Account Onboarding, Asset Allocation, Cash/Asset Movement workflows",
          "Processed $100M+ daily with 99.99% production success rate",
          "Converted to direct hire at Capital Group based on performance",
        ],
      },
    ],
  },
  {
    company: "Viasat",
    location: "Denver, CO",
    logo: "VS",
    roles: [
      {
        title: "Software Engineer",
        team: "Back Office",
        period: "May 2017 - Nov 2018",
        highlights: [
          "Core team member standing up initial AWS cloud infrastructure",
          "Built VPC, subnets, EC2, Docker, load balancing, API gateways with Terraform",
          "Developed web services using Java, Python, JAX-WS, WebLogic, Tomcat",
        ],
      },
    ],
  },
]

const projects = [
  {
    name: "tcg-price-guide",
    description: "Quickly find the value or details of your TCG cards.",
    link: "https://github.com/0xdsqr/tcg-price-guide",
    tags: ["TypeScript", "Python"],
  },
  {
    name: "durable-lambda",
    description:
      "Actor-based state management for AWS Lambda with single-instance guarantees and distributed locking.",
    link: "https://github.com/0xdsqr/durable-lambda",
    tags: ["AWS", "TypeScript", "DynamoDB"],
  },
  {
    name: "dodo",
    description:
      "A modern DynamoDB toolkit built on functional patterns and Zod validation.",
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

const patent = {
  title: "Cloud Incubation and Deployment Platform",
  number: "US 20250348299",
}

const certifications = [
  { name: "AWS Solutions Architect – Professional" },
  { name: "AWS DevOps Engineer – Professional" },
]

const skills = {
  languages: ["TypeScript", "Go", "Java", "Python"],
  cloud: [
    "Lambda",
    "ECS",
    "EC2",
    "DynamoDB",
    "Aurora",
    "S3",
    "EventBridge",
    "Step Functions",
    "IAM",
    "DMS",
    "CDK",
  ],
  frameworks: ["Hono", "Gin", "Spring", "JAX-RS", "Bun"],
  infrastructure: ["CDK", "Nix", "Docker", "Cloudflare"],
  cicd: ["Gradle", "GitLab CI", "GitHub Actions"],
  frontend: ["React", "Solid"],
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
            <img
              src={profile.image}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold">
              {profile.name}
            </h1>
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
        <p className="text-sm leading-relaxed text-muted-foreground">
          {profile.summary}
        </p>
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
                  <span className="text-xs text-muted-foreground">
                    {exp.location}
                  </span>
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
                        <li
                          key={highlight}
                          className="text-xs text-muted-foreground flex gap-2"
                        >
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
                <p className="text-xs text-muted-foreground">
                  {project.description}
                </p>
                <div className="flex gap-2 pt-1">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] text-muted-foreground"
                    >
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
            CSU
          </div>
          <div>
            <h3 className="font-medium">Colorado State University</h3>
            <p className="text-sm text-muted-foreground">
              Bachelor of Science, Computer Science
            </p>
            <p className="text-xs text-muted-foreground">Fort Collins, CO</p>
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
              <p className="text-xs text-muted-foreground">
                Patent Pending · {patent.number}
              </p>
            </div>
          </div>

          {certifications.map((cert) => (
            <div key={cert.name} className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                AWS
              </div>
              <div>
                <h3 className="font-medium text-sm">{cert.name}</h3>
                <p className="text-xs text-muted-foreground">
                  Amazon Web Services
                </p>
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
      <motion.section
        variants={item}
        className="border-t border-border pt-6 text-center space-y-2"
      >
        <p className="text-xs text-muted-foreground">
          Want to chat about cloud, distributed systems, or developer tooling?
        </p>
        <div className="flex items-center justify-center gap-3 text-xs">
          <Link
            to="/posts"
            className="text-primary hover:underline underline-offset-4"
          >
            Read my posts
          </Link>
          <span className="text-muted-foreground">·</span>
          <a
            href={profile.links.email}
            className="text-primary hover:underline underline-offset-4"
          >
            Get in touch
          </a>
        </div>
      </motion.section>
    </motion.div>
  )
}

export { AboutPage }
