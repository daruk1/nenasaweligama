import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, ClipboardCheck, Sparkles } from "lucide-react";
import heroBg from "@/assets/hero-bg.png";
import FadeIn from "@/components/FadeIn";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 12) return { text: "Good Morning", emoji: "🌅" };
  if (hour >= 12 && hour < 16) return { text: "Good Afternoon", emoji: "☀️" };
  if (hour >= 16 && hour < 19) return { text: "Good Evening", emoji: "🌇" };
  return { text: "Good Night", emoji: "🌙" };
};

const HeroSection = () => (
  <section className="relative overflow-hidden">
    <div className="absolute inset-0">
      <img src={heroBg} alt="Students learning" className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/85 to-primary/75" />
    </div>

    {/* Decorative floating elements */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-20 right-[10%] w-64 h-64 rounded-full bg-accent/10 blur-3xl animate-pulse" />
      <div className="absolute bottom-10 left-[5%] w-48 h-48 rounded-full bg-accent/5 blur-2xl animate-pulse" style={{ animationDelay: "1s" }} />
    </div>

    <div className="container relative mx-auto px-4 py-28 md:py-40">
      <div className="max-w-2xl">
        <FadeIn delay={100}>
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm text-accent mb-6 backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
            Nenasa Education Center — Weligama
          </div>
        </FadeIn>
        <FadeIn delay={200}>
          <p className="text-accent font-extrabold text-3xl md:text-5xl mb-4 flex items-center gap-3">
            <span className="text-5xl md:text-7xl">{getGreeting().emoji}</span> {getGreeting().text}
          </p>
        </FadeIn>
        <FadeIn delay={350}>
          <h1 className="font-display text-4xl font-extrabold leading-tight text-primary-foreground md:text-6xl">
            Unlock Your{" "}
            <span className="text-gradient">Academic Potential</span>
          </h1>
        </FadeIn>
        <FadeIn delay={500}>
          <p className="mt-5 text-lg leading-relaxed text-primary-foreground/80 md:text-xl">
            Join Nenasa Education Center for expert classes in English, Mathematics,
            Science & ICT. Check your exam results and register for upcoming classes today.
          </p>
        </FadeIn>
        <FadeIn delay={650}>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/register">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold gap-2 shadow-lg shadow-accent/25 transition-all hover:shadow-xl hover:shadow-accent/30 hover:-translate-y-0.5">
                <BookOpen className="h-5 w-5" />
                Register for Classes
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/results">
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 gap-2 backdrop-blur-sm transition-all hover:-translate-y-0.5">
                <ClipboardCheck className="h-5 w-5" />
                Check Results
              </Button>
            </Link>
          </div>
        </FadeIn>
      </div>
    </div>
  </section>
);

export default HeroSection;
