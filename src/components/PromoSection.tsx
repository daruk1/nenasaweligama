import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import FadeIn from "./FadeIn";
import englishPromo from "@/assets/english-promo.jpeg";
import englishPromo2028 from "@/assets/english-promo-2028.png";

const PromoSection = () => (
  <section className="bg-secondary py-16">
    <div className="container mx-auto px-4">
      {/* First promo */}
      <div className="flex flex-col items-center gap-10 md:flex-row">
        <FadeIn direction="left" className="w-full md:w-1/2">
          <img
            src={englishPromo}
            alt="English Course Promotion - 4 Month English Programme"
            className="w-full max-w-md mx-auto rounded-2xl shadow-[var(--card-shadow)] transition-transform duration-500 hover:scale-105"
          />
        </FadeIn>
        <FadeIn direction="right" delay={200} className="w-full md:w-1/2 text-center md:text-left">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            4 Month English Programme
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Join our most popular English course taught by expert teachers.
            Perfect for job seekers, A/L students, university students, and professionals.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>📍 NEW Nenasa - Weligama</li>
            <li>📅 Every Saturday, 6.00 PM - 8.00 PM</li>
            <li>📞 077 50 79 170</li>
          </ul>
          <Link to="/register" className="mt-6 inline-block">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold gap-2 shadow-lg shadow-accent/20 hover:shadow-xl hover:-translate-y-0.5 transition-all">
              Register Now <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </FadeIn>
      </div>

      {/* Second promo */}
      <div className="mt-16 flex flex-col items-center gap-10 md:flex-row-reverse">
        <FadeIn direction="right" className="w-full md:w-1/2">
          <img
            src={englishPromo2028}
            alt="Advanced Level General English 2028 - Chandana Hettiarachchi"
            className="w-full max-w-lg mx-auto rounded-2xl shadow-[var(--card-shadow)] transition-transform duration-500 hover:scale-105"
          />
        </FadeIn>
        <FadeIn direction="left" delay={200} className="w-full md:w-1/2 text-center md:text-left">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            A/L General English 2028
          </h2>
          <p className="mt-2 text-lg font-semibold text-accent">Cool English For Your Future</p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            දකුණේ අංක 1 ඉංග්‍රීසි පන්තිය — Advanced Level General English by Chandana Hettiarachchi.
            The most popular young English teacher among students.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>📍 Art House - මාතර</li>
            <li>📅 මාර්තු 03 සිට සෑම අඟහරුවාදාම පෙ.ව. 10.30 ට</li>
            <li>📞 077 50 79 170</li>
          </ul>
          <Link to="/register" className="mt-6 inline-block">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold gap-2 shadow-lg shadow-accent/20 hover:shadow-xl hover:-translate-y-0.5 transition-all">
              Register Now <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </FadeIn>
      </div>
    </div>
  </section>
);

export default PromoSection;
