import nenasaLogo from "@/assets/nenasa-logo.jpeg";
import { Phone } from "lucide-react";

const Footer = () => (
  <footer className="border-t bg-primary py-10 text-primary-foreground">
    <div className="container mx-auto px-4">
      <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
        <div className="flex items-center gap-3">
          <img src={nenasaLogo} alt="Nenasa Education Logo" className="h-10 w-auto rounded" />
          <span className="font-display text-lg font-bold">Nenasa Education</span>
        </div>
        <div className="flex items-center gap-2 text-sm opacity-80">
          <Phone className="h-4 w-4" />
          <span>077 50 79 170</span>
        </div>
        <p className="text-sm opacity-70">
          © {new Date().getFullYear()} Nenasa Education Center. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
