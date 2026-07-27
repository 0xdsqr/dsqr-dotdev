import type { SVGProps } from "react"

function GitHubLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" focusable="false" aria-hidden="true" {...props}>
      <path d="M12 .297A12 12 0 0 0 8.207 23.68c.6.111.82-.261.82-.577 0-.286-.011-1.04-.017-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.386-1.333-1.755-1.333-1.755-1.09-.745.083-.73.083-.73 1.205.085 1.839 1.237 1.839 1.237 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.762-1.605-2.665-.303-5.466-1.333-5.466-5.93 0-1.31.468-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.5 11.5 0 0 1 12 6.088c1.02.005 2.046.138 3.004.404 2.291-1.552 3.297-1.23 3.297-1.23.655 1.652.243 2.873.12 3.176.769.84 1.234 1.911 1.234 3.221 0 4.609-2.805 5.624-5.478 5.921.43.37.814 1.103.814 2.222 0 1.606-.015 2.9-.015 3.293 0 .319.216.694.825.576A12 12 0 0 0 12 .297" />
    </svg>
  )
}

function GitLabLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" focusable="false" aria-hidden="true" {...props}>
      <path d="m22.65 14.39-10.65 7.74L1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51a.4.4 0 0 1 .77 0l2.44 7.51h8.16l2.44-7.51a.4.4 0 0 1 .77 0l2.44 7.51 1.22 3.78a.84.84 0 0 1-.3.94Z" />
    </svg>
  )
}

function LinkedInLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" focusable="false" aria-hidden="true" {...props}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.048c.475-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124ZM7.119 20.452H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0Z" />
    </svg>
  )
}

function XLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" focusable="false" aria-hidden="true" {...props}>
      <path d="M13.9 10.47 21.35 2h-1.76l-6.47 7.35L7.96 2H2l7.81 11.12L2 22h1.76l6.83-7.77L16.04 22H22zM11.48 13.21l-.79-1.1L4.4 3.3h2.72l5.08 7.11.79 1.1 6.6 9.24h-2.72z" />
    </svg>
  )
}

export { GitHubLogo, GitLabLogo, LinkedInLogo, XLogo }
