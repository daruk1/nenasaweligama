import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import nenasaLogo from "@/assets/nenasa-logo.jpeg";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Subjects", path: "/subjects" },
  { label: "Check Results", path: "/results" },
  { label: "Register", path: "/auth" },
  
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 liquid-glass border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <img src={nenasaLogo} alt="Nenasa Education Logo" className="h-10 w-auto rounded transition-transform group-hover:scale-105" />
          <span className="font-display text-lg font-bold text-foreground hidden sm:inline">
            Nenasa <span className="text-accent">Education</span>
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <Button
                variant={location.pathname === item.path ? "default" : "ghost"}
                size="sm"
                className="transition-all hover:-translate-y-0.5"
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </div>

        {/* Mobile toggle */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t bg-card px-4 pb-4 md:hidden animate-fade-in">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} onClick={() => setOpen(false)}>
              <Button
                variant={location.pathname === item.path ? "default" : "ghost"}
                className="w-full justify-start"
                size="sm"
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
