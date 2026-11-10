export function Logo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="14" fill="#042217" />
      <path
        d="M10 33.5c4.6-1.1 7.5-4 9.4-8.2 1.1-2.5 1.3-5.1 1.1-7.8 2.6.6 4.7 2 6.2 4.2 1.6 2.3 2 4.9 1.3 7.8-.8 3.5-3.2 6.1-7 7.7"
        stroke="#AEEECB"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.4 30.8c2.6-2.7 4.6-5.9 5.9-9.5"
        stroke="#AEEECB"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M26.6 33.2c3.9-1.4 6.4-3.8 7.4-7.2.8-2.6.6-5.1-.4-7.5-3 .3-5.4 1.6-7 3.8"
        stroke="#2C694E"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="33.4" cy="14.4" r="2.2" fill="#E76F51" />
    </svg>
  );
}

export function LogoWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Logo className="h-9 w-9" />
      <span className="flex flex-col leading-none">
        <span className="font-extrabold tracking-tight text-primary text-[19px] leading-none">
          ORIGEN
        </span>
        <span className="font-bold tracking-[0.22em] text-secondary text-[10px] mt-1">CHIAPAS</span>
      </span>
    </span>
  );
}
