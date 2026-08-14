import { Link } from "@tanstack/react-router";
import React from "react";
import brandLogo from "@/assets/mailreply-logo.png";
import { useAuth } from "@/hooks/useAuth";

interface ShellProps {
  children: React.ReactNode;
  rightNav?: React.ReactNode;
}

export function Shell({ children, rightNav }: ShellProps) {
  const { session } = useAuth();

  return (
    <div className="grain-bg min-h-screen flex flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6 border-b border-border/40">
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <img
            src={brandLogo}
            alt="MailReply AI logo"
            width={36}
            height={36}
            className="size-9 rounded-xl"
          />
          <span className="font-display text-lg font-semibold">MailReply AI</span>
        </Link>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link to="/guide" className="text-muted-foreground hover:text-foreground transition-colors">
              Guide
            </Link>
            {session && (
              <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
            )}
          </nav>
          {rightNav}
        </div>
      </header>
      
      <div className="flex-1">
        {children}
      </div>

      {/* Shared Footer */}
      <footer className="mx-auto w-full max-w-5xl px-6 py-8 border-t border-border/40 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground mt-12">
        <div>&copy; {new Date().getFullYear()} MailReply AI. All rights reserved.</div>
        <div className="flex flex-wrap justify-center gap-6">
          <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
          <Link to="/guide" className="hover:text-foreground transition-colors">Guide</Link>
          <Link to="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
}
