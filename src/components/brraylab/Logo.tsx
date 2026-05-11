import { Link } from "react-router-dom";
import { useBrandSettings } from "@/hooks/useBrandSettings";

export const Logo = ({ className = "" }: { className?: string }) => {
  const { data } = useBrandSettings();
  const logoUrl = data?.logo_url;

  return (
    <Link to="/" className={`flex items-center gap-2 group ${className}`} aria-label="BrrayLab inicio">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt="BrrayLab"
          className="h-9 w-auto max-w-[180px] object-contain transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <>
          <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary transition-all duration-300 group-hover:bg-primary-glow">
            <span className="font-display font-extrabold text-primary-foreground text-base leading-none">B</span>
            <span className="absolute -inset-1 rounded-lg bg-primary/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </span>
          <span className="font-display font-extrabold tracking-tight text-foreground text-lg">
            Brray<span className="text-primary-glow">Lab</span>
          </span>
        </>
      )}
    </Link>
  );
};
