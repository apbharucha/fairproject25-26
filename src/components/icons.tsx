import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.4" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

export function DnaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 4c0 4.418 3.582 8 8 8s8-3.582 8-8" />
      <path d="M20 20c0-4.418-3.582-8-8-8s-8 3.582-8 8" />
      <path d="M4 12h16" />
      <path d="M7 4v16" />
      <path d="M17 4v16" />
    </svg>
  );
}

export function BacteriaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
      <path d="M15 9l-6 6" />
      <path d="M9 9l6 6" />
      <path d="M8 16l-3-3" />
      <path d="M16 8l3 3" />
      <path d="M20 14l-2-2" />
      <path d="M4 10l2 2" />
    </svg>
  );
}

export function DnaHelixIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 12c0 4.418 3.582 8 8 8s8-3.582 8-8" />
      <path d="M20 12c0-4.418-3.582-8-8-8s-8 3.582-8 8" />
      <path d="M4 4c0 4.418 3.582 8 8 8" />
      <path d="M20 4c0 4.418-3.582 8-8 8" />
      <path d="M4 20c0-4.418 3.582-8 8-8" />
      <path d="M20 20c0-4.418-3.582-8 8-8" />
      <line x1="8" x2="16" y1="4" y2="4" />
      <line x1="8" x2="16" y1="20" y2="20" />
    </svg>
  );
}

export function GeneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  );
}
