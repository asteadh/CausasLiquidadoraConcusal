import { cn } from "@/lib/utils";

const ACCENT_COLOR = "#52B4D0";

type ClcLogoIconProps = React.SVGProps<SVGSVGElement> & {
  compact?: boolean;
};

function ClcMonogram({ accentColor = ACCENT_COLOR }: { accentColor?: string }) {
  return (
    <g>
      {/* Scale beam + pans: balance/liquidation motif */}
      <rect x="29" y="8" width="6" height="34" rx="2" fill="currentColor" />
      <rect x="12" y="12" width="40" height="5" rx="2.5" fill="currentColor" />
      <path
        d="M14 17L8 32C8 36.4183 11.5817 40 16 40C20.4183 40 24 36.4183 24 32L18 17"
        stroke={accentColor}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M46 17L40 32C40 36.4183 43.5817 40 48 40C52.4183 40 56 36.4183 56 32L50 17"
        stroke={accentColor}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <rect x="20" y="50" width="24" height="6" rx="3" fill="currentColor" />
    </g>
  );
}

export function ClcLogoIcon({ className, compact = false, ...props }: ClcLogoIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={compact ? "0 0 64 64" : "0 0 200 64"}
      preserveAspectRatio="xMidYMid meet"
      className={cn("fill-current", className)}
      aria-label="Causas Liquidadora Concursal"
      role="img"
      {...props}
    >
      <ClcMonogram />
      {!compact ? (
        <text
          x="72"
          y="41"
          fill="currentColor"
          fontFamily="ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica Neue,Arial"
          fontSize="26"
          fontWeight="700"
          letterSpacing="1.5"
        >
          CLC
        </text>
      ) : null}
    </svg>
  );
}

export default ClcLogoIcon;
