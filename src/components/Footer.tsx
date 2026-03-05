import { Link } from "react-router-dom";
import nenasaLogo from "@/assets/nenasa-logo.jpeg";
import { Phone, MapPin, Mail } from "lucide-react";

const Footer = () => (
  <footer className="border-t bg-primary py-12 text-primary-foreground">
    <div className="container mx-auto px-4">
      <div className="grid gap-8 md:grid-cols-3">
        {/* Brand */}
        <div className="flex flex-col items-center md:items-start gap-3">
          <div className="flex items-center gap-3">
            <img src={nenasaLogo} alt="Nenasa Education Logo" className="h-12 w-auto rounded" />
            <span className="font-display text-xl font-bold">Nenasa Education</span>
          </div>
          <p className="text-sm text-primary-foreground/70 text-center md:text-left">
            Empowering students to achieve their academic potential through quality education.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col items-center md:items-start gap-3">
          <h3 className="font-display text-lg font-bold">Quick Links</h3>
          <div className="flex flex-col gap-2 text-sm text-primary-foreground/70">
            <Link to="/subjects" className="hover:text-accent transition-colors">Subjects</Link>
            <Link to="/results" className="hover:text-accent transition-colors">Check Results</Link>
            <Link to="/auth" className="hover:text-accent transition-colors">Register</Link>
          </div>
        </div>

        {/* Contact */}
        <div className="flex flex-col items-center md:items-start gap-3">
          <h3 className="font-display text-lg font-bold">Contact Us</h3>
          <div className="flex flex-col gap-2 text-sm text-primary-foreground/70">
            <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-accent"/> 077 50 79 170</span>
            <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-accent"/> Weligama, Sri Lanka</span>
          </div>
        </div>
      </div>

      <div className="mt-10 border-t border-primary-foreground/10 pt-6 text-center text-sm text-primary-foreground/50">
        Developed by Daruka — © {new Date().getFullYear()} Nenasa Education Center. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
