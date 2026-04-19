import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import SubjectCard from "./SubjectCard";
import FadeIn from "./FadeIn";
import englishPromo from "@/assets/english-promo.jpeg";
import englishPromo2028 from "@/assets/english-promo-2028.png";

const subjects = [
  {
    title: "Mathematics",
    description: "Master arithmetic, algebra, geometry and problem-solving with expert guidance.",
    emoji: "📐",
    color: "bg-[hsl(152,60%,40%)]",
  },
  {
    title: "English",
    description: "Build strong language skills with grammar, comprehension, creative writing and communication.",
    emoji: "📚",
    color: "bg-[hsl(220,60%,20%)]",
  },
  {
    title: "Science",
    description: "Explore biology, chemistry and physics through interactive lessons and experiments.",
    emoji: "🔬",
    color: "bg-[hsl(280,60%,45%)]",
  },
  {
    title: "ICT",
    description: "Learn computing fundamentals, programming basics and digital literacy skills.",
    emoji: "💻",
    color: "bg-[hsl(38,92%,50%)]",
  },
  {
    title: "Sinhala",
    description: "Strengthen Sinhala language, literature, grammar and creative writing for academic success.",
    emoji: "📝",
    color: "bg-[hsl(0,70%,50%)]",
  },
  {
    title: "Commerce",
    description: "Master accounting, business studies and economics with practical, exam-focused lessons.",
    emoji: "💼",
    color: "bg-[hsl(200,70%,40%)]",
  },
];

const promos = [
  {
    image: englishPromo,
    alt: "4 Month English Programme",
    title: "4 Month English Programme",
    subtitle: null,
    description: "Join our most popular English course taught by expert teachers. Perfect for job seekers, A/L students, university students, and professionals.",
    details: [
      "📍 NEW Nenasa - Weligama",
      "📅 Every Saturday, 6.00 PM - 8.00 PM",
      "📞 077 50 79 170",
    ],
  },
  {
    image: englishPromo2028,
    alt: "A/L General English 2028",
    title: "A/L General English 2028",
    subtitle: "Cool English For Your Future",
    description: "දකුණේ අංක 1 ඉංග්‍රීසි පන්තිය — Advanced Level General English by Chandana Hettiarachchi.",
    details: [
      "📍 Art House - මාතර",
      "📅 මාර්තු 03 සිට සෑම අඟහරුවාදාම පෙ.ව. 10.30 ට",
      "📞 077 50 79 170",
    ],
  },
];

const SubjectsSection = () => (
  <section className="py-20">
    <div className="container mx-auto px-4">
      <FadeIn>
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            Our Subjects
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            We offer comprehensive classes across four key subjects to help students excel.
          </p>
        </div>
      </FadeIn>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((subject, i) => (
          <FadeIn key={subject.title} delay={150 * (i + 1)}>
            <SubjectCard {...subject} />
          </FadeIn>
        ))}
      </div>

      {/* Promo cards */}
      <FadeIn>
        <div className="mt-16 mb-6 text-center">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            🎓 Our Programmes
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Enroll in our featured programmes and take your skills to the next level.
          </p>
        </div>
      </FadeIn>
      <div className="grid gap-8 md:grid-cols-2">
        {promos.map((promo, i) => (
          <FadeIn key={promo.title} delay={200 * (i + 1)} direction={i === 0 ? "left" : "right"}>
            <div className="group overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--card-shadow)] transition-all duration-300 hover:shadow-[var(--card-hover-shadow)] hover:scale-[1.02]">
              <div className="overflow-hidden">
                <img src={promo.image} alt={promo.alt} className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110" />
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl font-bold text-foreground">{promo.title}</h3>
                {promo.subtitle && <p className="text-sm font-semibold text-accent mt-1">{promo.subtitle}</p>}
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{promo.description}</p>
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {promo.details.map((d) => <li key={d}>{d}</li>)}
                </ul>
                <Link to="/register" className="mt-4 inline-block">
                  <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold gap-2 shadow-lg shadow-accent/20 hover:shadow-xl hover:-translate-y-0.5 transition-all">
                    Register Now <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  </section>
);

export default SubjectsSection;
