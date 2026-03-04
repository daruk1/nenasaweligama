import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface SubjectCardProps {
  title: string;
  description: string;
  emoji: string;
  color: string;
}

const SubjectCard = ({ title, description, emoji, color }: SubjectCardProps) => (
  <Card className="group relative overflow-hidden border-0 shadow-[var(--card-shadow)] transition-all duration-300 hover:shadow-[var(--card-hover-shadow)] hover:-translate-y-1">
    <div className={`absolute left-0 top-0 h-1 w-full ${color}`} />
    <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
      <span className="text-5xl">{emoji}</span>
      <h3 className="font-display text-xl font-bold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      <Link to="/register">
        <Button variant="ghost" size="sm" className="mt-auto gap-1 px-0 text-accent hover:text-accent/80">
          Enroll Now <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </CardContent>
  </Card>
);

export default SubjectCard;
