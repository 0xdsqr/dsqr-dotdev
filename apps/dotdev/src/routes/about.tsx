import { SectionHeading } from "@dsqr-dotdev/react/components/section-heading"
import { createFileRoute } from "@tanstack/react-router"
import { ExperienceTimeline, type ExperienceItem } from "@/components/experience"
import { PageSection } from "@/components/page-section"
import { ProjectList, type ProjectItem } from "@/components/project-list"
import { SectionRail } from "@/components/section-rail"

const aboutSections = [
  { id: "experience", label: "work" },
  { id: "projects", label: "projects" },
  { id: "interests", label: "interests" },
]

const experience: ExperienceItem[] = [
  {
    company: "Stablecore",
    logo: "/logos/stablecore.png",
    roles: [
      {
        title: "Senior Software Engineer",
        period: "may 2026 – present",
        location: "dallas, tx · remote",
      },
    ],
  },
  {
    company: "Goldman Sachs",
    logo: "/logos/goldman-sachs.png",
    roles: [
      {
        title: "Vice President · Software Engineer · Cloud Platform",
        period: "nov 2023 – may 2026",
        location: "dallas, tx",
      },
      {
        title: "Vice President · Software Engineer · GS Innovation Center",
        period: "sep 2022 – nov 2023",
        location: "dallas, tx",
      },
    ],
  },
  {
    company: "Capital Group",
    logo: "/logos/capital-group.png",
    roles: [
      {
        title: "Software Engineer III",
        period: "sep 2020 – sep 2022",
        location: "irvine, ca",
      },
    ],
  },
  {
    company: "EY",
    logo: "/logos/ey.png",
    roles: [
      {
        title: "Senior Consultant · Wealth & Asset Management",
        period: "may 2020 – sep 2020",
        location: "irvine, ca",
        client: "Capital Group · retirement plan services",
      },
    ],
  },
  {
    company: "KPMG",
    logo: "/logos/kpmg.png",
    roles: [
      {
        title: "Associate · Intelligent Automation",
        period: "nov 2018 – may 2020",
        location: "denver, co",
        client: "Capital Group · private client services",
      },
    ],
  },
  {
    company: "Viasat",
    logo: "/logos/viasat.png",
    roles: [
      {
        title: "Software Engineer",
        period: "may 2017 – nov 2018",
        location: "denver, co",
      },
      {
        title: "Software Engineer Intern",
        period: "may 2016 – aug 2016",
        location: "denver, co",
      },
    ],
  },
  {
    company: "Junior Achievement Rocky Mountain",
    logo: "/logos/junior-achievement.png",
    roles: [
      {
        title: "Data Intern",
        period: "jun 2015 – sep 2015",
        location: "denver, co",
      },
    ],
  },
]

const projects: ProjectItem[] = [
  {
    name: "tastings with tay",
    description: "Recipes, life & good food — built with and for Tay.",
    repo: "https://github.com/0xdsqr/tastingswithtay",
    site: "https://tastingswithtay.com",
  },
  {
    name: "fidara",
    description: "Search nonprofit records — IRS filings, financials, people, and provenance.",
    site: "https://fidara.io",
    note: "repo soon",
  },
  {
    name: "cdk-diff-action",
    description: "GitHub Action that posts CDK diffs on pull requests. Old, but it did the job.",
    repo: "https://github.com/0xdsqr/cdk-diff-action",
  },
]

const technicalInterests = [
  "infrastructure",
  "distributed systems",
  "platforms",
  "performance",
  "operations",
  "kubernetes",
  "nix",
  "golang",
  "typescript",
  "aws",
]

const hobbies = ["hardware", "homelab", "collecting nice things"]

export const Route = createFileRoute("/about")({
  component: AboutPage,
})

function InterestGroup({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="space-y-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-sm border border-dotted border-border px-2.5 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function AboutPage() {
  return (
    <>
      <SectionRail sections={aboutSections} />

      <div className="space-y-14">
        <div className="space-y-6">
          <SectionHeading as="h1">about</SectionHeading>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="size-20 shrink-0 overflow-hidden rounded-md border border-border bg-muted shadow-sm">
              <img src="/me.jpeg" alt="0xdsqr" className="size-full object-cover" />
            </div>
            <p className="max-w-2xl text-sm leading-7 text-foreground/90">
              I&apos;m a software engineer focused on infrastructure, distributed systems, and
              performance — currently building at Stablecore, previously Goldman Sachs and Capital
              Group. Outside of work I&apos;m a dad of one who enjoys hardware, Nix, and collecting
              things that are nice to look at.
            </p>
          </div>
        </div>

        <PageSection id="experience" title="experience">
          <ExperienceTimeline items={experience} />
        </PageSection>

        <PageSection id="projects" title="projects">
          <ProjectList projects={projects} />
        </PageSection>

        <PageSection id="interests" title="interests" last>
          <div className="max-w-2xl space-y-7">
            <InterestGroup label="technical" items={technicalInterests} />
            <InterestGroup label="hobbies" items={hobbies} />
          </div>
        </PageSection>
      </div>
    </>
  )
}
