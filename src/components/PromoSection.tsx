import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import englishPromo from "@/assets/english-promo.jpeg";

const PromoSection = () => (
  <section className="bg-secondary py-16">
    <div className="container mx-auto px-4">
      <div className="flex flex-col items-center gap-10 md:flex-row">
        <div className="w-full md:w-1/2">
          <img
            src={englishPromo}
            alt="English Course Promotion - 4 Month English Programme"
            className="w-full max-w-md mx-auto rounded-2xl shadow-[var(--card-shadow)]"
          />
        </div>
        <div className="w-full md:w-1/2 text-center md:text-left">
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
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold gap-2">
              Register Now <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  </section>
);

export default PromoSection;
