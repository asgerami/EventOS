import Link from "next/link";
import { cn } from "@/lib/utils";

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

/**
 * The identity is the wordmark; the mark is its anchor.
 *
 * A solid accent tile carrying a heavy geometric "E" — the same three-bar
 * skeleton the display face uses, cut square. Two flat colours, no gradient,
 * no stroke, so it stays crisp at 16px and reproduces in a single ink on a
 * badge or a printed lanyard.
 */
function LogoIcon({ size = 28 }: { size?: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width={size}
            height={size}
            className="shrink-0"
            role="img"
            aria-label="EventOS"
        >
            <rect width="24" height="24" rx="5" fill="var(--volt, #0565d8)" />
            {/* The E: a full-height stem with three arms, the middle one short. */}
            <g fill="#fff">
                <rect x="6" y="5.5" width="3.1" height="13" />
                <rect x="6" y="5.5" width="11.4" height="3.1" />
                <rect x="6" y="10.45" width="8" height="3.1" />
                <rect x="6" y="15.4" width="11.4" height="3.1" />
            </g>
        </svg>
    );
}

export function Logo({
    size = 28,
    showText = true,
    textClassName,
    linked = true,
    className = "",
}: LogoProps) {
    const inner = (
        <>
            <LogoIcon size={size} />
            {showText && (
                <span
                    className={cn(
                        "font-display text-[1.125rem] leading-none font-extrabold tracking-[-0.035em]",
                        textClassName
                    )}
                >
                    EventOS
                </span>
            )}
        </>
    );

    const wrapperClass = cn("flex items-center gap-2.5 text-ink", className);

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
