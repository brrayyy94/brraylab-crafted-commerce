import { Link } from "react-router-dom";

export const Logo = ({ className = "" }: { className?: string }) => (
  <Link to="/" className={`flex items-center gap-2 group ${className}`} aria-label="BrrayLab inicio">
    <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary transition-all duration-300 group-hover:bg-primary-glow">
      <span className="font-display font-extrabold text-primary-foreground text-base leading-none">B</span>
      <span className="absolute -inset-1 rounded-lg bg-primary/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </span>
    <span className="font-display font-extrabold tracking-tight text-foreground text-lg">
      Brray<span className="text-primary-glow">Lab</span>
    </span>
  </Link>
);
