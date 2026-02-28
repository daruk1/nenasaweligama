import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Award } from "lucide-react";
import { toast } from "sonner";

// Mock data for demo
const mockResults: Record<string, { name: string; subjects: { subject: string; marks: number; grade: string }[] }> = {
  "STU001": {
    name: "Kamal Perera",
    subjects: [
      { subject: "English", marks: 82, grade: "A" },
      { subject: "Mathematics", marks: 91, grade: "A+" },
      { subject: "Science", marks: 76, grade: "B+" },
      { subject: "ICT", marks: 88, grade: "A" },
    ],
  },
  "STU002": {
    name: "Nimal Silva",
    subjects: [
      { subject: "English", marks: 65, grade: "B" },
      { subject: "Mathematics", marks: 74, grade: "B+" },
      { subject: "Science", marks: 58, grade: "C+" },
      { subject: "ICT", marks: 80, grade: "A" },
    ],
  },
};

const gradeColor = (grade: string) => {
  if (grade.startsWith("A")) return "text-success";
  if (grade.startsWith("B")) return "text-accent";
  return "text-muted-foreground";
};

const Results = () => {
  const [studentId, setStudentId] = useState("");
  const [result, setResult] = useState<typeof mockResults["STU001"] | null>(null);

  const handleSearch = () => {
    const found = mockResults[studentId.toUpperCase()];
    if (found) {
      setResult(found);
    } else {
      setResult(null);
      toast.error("No results found. Try STU001 or STU002 for demo.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-xl text-center">
          <Award className="mx-auto mb-4 h-12 w-12 text-accent" />
          <h1 className="font-display text-3xl font-bold md:text-4xl">Check Exam Results</h1>
          <p className="mt-2 text-muted-foreground">
            Enter your Student ID to view your exam results.
          </p>

          <div className="mt-8 flex gap-3">
            <Input
              placeholder="Enter Student ID (e.g. STU001)"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="text-center"
            />
            <Button onClick={handleSearch} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
              <Search className="h-4 w-4" /> Search
            </Button>
          </div>
        </div>

        {result && (
          <Card className="mx-auto mt-10 max-w-xl border-0 shadow-[var(--card-shadow)]">
            <CardHeader>
              <CardTitle className="font-display text-xl">
                Results for {result.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {result.subjects.map((s) => (
                  <div
                    key={s.subject}
                    className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3"
                  >
                    <span className="font-medium">{s.subject}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">{s.marks}/100</span>
                      <span className={`font-bold ${gradeColor(s.grade)}`}>{s.grade}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Results;
