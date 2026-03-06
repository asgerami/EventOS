import Link from "next/link";

interface LogoProps {
    /** Width/height of the icon in pixels */
    size?: number;
    /** Show "EventOS" text beside the icon */
    showText?: boolean;
    /** CSS class for the text label */
    textClassName?: string;
    /** Wrap in a link to "/" */
    linked?: boolean;
    /** Extra classes on the outer wrapper */
    className?: string;
}

function LogoIcon({ size = 28 }: { size?: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            fill="none"
            width={size}
            height={size}
            className="shrink-0"
            aria-label="EventOS logo"
        >
            <defs>
                <linearGradient id="eos-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>
                <linearGradient id="eos-accent" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
            </defs>

            {/* Rounded background */}
            <rect width="512" height="512" rx="112" fill="url(#eos-bg)" />

            {/* Calendar top bar */}
            <rect x="96" y="88" width="320" height="56" rx="16" fill="rgba(255,255,255,0.2)" />
            <rect x="168" y="68" width="16" height="44" rx="8" fill="rgba(255,255,255,0.9)" />
            <rect x="328" y="68" width="16" height="44" rx="8" fill="rgba(255,255,255,0.9)" />

            {/* Calendar body */}
            <rect x="96" y="144" width="320" height="288" rx="16" fill="rgba(255,255,255,0.15)" />

            {/* Stylized E — event blocks */}
            <rect x="144" y="176" width="224" height="48" rx="10" fill="white" />
            <rect x="144" y="256" width="176" height="48" rx="10" fill="white" />
            <rect x="144" y="336" width="224" height="48" rx="10" fill="white" />
            <rect x="144" y="176" width="56" height="208" rx="10" fill="white" />

            {/* Live indicator dot */}
            <circle cx="392" cy="280" r="20" fill="url(#eos-accent)" />
            <circle cx="392" cy="280" r="10" fill="white" opacity="0.9" />
        </svg>
    );
}

export function Logo({
    size = 28,
    showText = true,
    textClassName = "text-sm font-semibold tracking-tight",
    linked = true,
    className = "",
}: LogoProps) {
    const inner = (
        <>
            <LogoIcon size={size} />
            {showText && <span className={textClassName}>EventOS</span>}
        </>
    );

    const wrapperClass = `flex items-center gap-2.5 ${className}`.trim();

    if (linked) {
        return (
            <Link href="/" className={wrapperClass}>
                {inner}
            </Link>
        );
    }

    return <div className={wrapperClass}>{inner}</div>;
}

export { LogoIcon };
