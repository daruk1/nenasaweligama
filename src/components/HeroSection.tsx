import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, ClipboardCheck } from "lucide-react";
import heroBg from "@/assets/hero-bg.png";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 16) return "Good Afternoon";
  if (hour >= 16 && hour < 19) return "Good Evening";
  return "Good Night";
};

const HeroSection = () => (
  <section className="relative overflow-hidden">
    {/* Background image with overlay */}
    <div className="absolute inset-0">
      <img src={heroBg} alt="Students learning" className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-primary/85" />
    </div>

    <div className="container relative mx-auto px-4 py-24 md:py-36">
      <div className="max-w-2xl">
        <p className="text-accent font-semibold text-lg mb-2">👋 {getGreeting()}!</p>
        <h1 className="font-display text-4xl font-extrabold leading-tight text-primary-foreground md:text-6xl">
          Unlock Your{" "}
          <span className="text-gradient">Academic Potential</span>
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-primary-foreground/80 md:text-xl">
          Join Nenasa Education Center for expert classes in English, Mathematics, 
          Science & ICT. Check your exam results and register for upcoming classes today.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link to="/register">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold gap-2">
              <BookOpen className="h-5 w-5" />
              Register for Classes
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/results">
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Check Results
            </Button>
          </Link>
        </div>
      </div>
    </div>
  </section>
);

export default HeroSection;
