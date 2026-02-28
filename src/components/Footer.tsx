import { GraduationCap } from "lucide-react";

const Footer = () => (
  <footer className="border-t bg-primary py-10 text-primary-foreground">
    <div className="container mx-auto px-4">
      <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-accent" />
          <span className="font-display text-lg font-bold">Nenasa Education</span>
        </div>
        <p className="text-sm opacity-70">
          © {new Date().getFullYear()} Nenasa Education Center. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
