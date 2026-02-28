import SubjectCard from "./SubjectCard";
import { BookOpen, Calculator, FlaskConical, Monitor } from "lucide-react";

const subjects = [
  {
    title: "English",
    description: "Build strong language skills with grammar, comprehension, creative writing and communication.",
    icon: BookOpen,
    color: "bg-[hsl(220,60%,20%)]",
  },
  {
    title: "Mathematics",
    description: "Master arithmetic, algebra, geometry and problem-solving with expert guidance.",
    icon: Calculator,
    color: "bg-[hsl(152,60%,40%)]",
  },
  {
    title: "Science",
    description: "Explore biology, chemistry and physics through interactive lessons and experiments.",
    icon: FlaskConical,
    color: "bg-[hsl(280,60%,45%)]",
  },
  {
    title: "ICT",
    description: "Learn computing fundamentals, programming basics and digital literacy skills.",
    icon: Monitor,
    color: "bg-[hsl(38,92%,50%)]",
  },
];

const SubjectsSection = () => (
  <section className="py-20">
    <div className="container mx-auto px-4">
      <div className="mb-12 text-center">
        <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
          Our Subjects
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          We offer comprehensive classes across four key subjects to help students excel.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {subjects.map((subject) => (
          <SubjectCard key={subject.title} {...subject} />
        ))}
      </div>
    </div>
  </section>
);

export default SubjectsSection;
