import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { UserPlus, Clock, CheckCircle, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const subjects = ["English", "Mathematics", "Science", "ICT"] as const;

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const toggleSubject = (subject: string) => {
    setSelected((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (selected.length === 0) {
      toast.error("Please select at least one subject.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-registration-email", {
        body: { name, email, phone, subjects: selected },
      });

      if (error) throw error;

      setIsSubmitted(true);
      setName("");
      setEmail("");
      setPhone("");
      setSelected([]);
    } catch (err) {
      console.error("Registration error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-16">
          <Card className="mx-auto max-w-lg border-0 shadow-[var(--card-shadow)]">
            <CardContent className="flex flex-col items-center gap-6 py-12 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
                <CheckCircle className="h-10 w-10 text-accent" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Registration Submitted!
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Your registration has been sent to our teacher successfully.
                </p>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-accent/10 px-6 py-4">
                <Clock className="h-8 w-8 text-accent" />
                <div className="text-left">
                  <p className="font-semibold text-foreground">We'll reply within 24 hours</p>
                  <p className="text-sm text-muted-foreground">Please check your email for confirmation</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>Check your inbox and spam folder</span>
              </div>

              <Button
                onClick={() => setIsSubmitted(false)}
                className="mt-2 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                size="lg"
              >
                Register Another Student
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <Card className="mx-auto max-w-lg border-0 shadow-[var(--card-shadow)]">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
              <UserPlus className="h-6 w-6 text-accent" />
            </div>
            <CardTitle className="font-display text-2xl">Register for Classes</CardTitle>
            <CardDescription>
              Fill out the form below to enroll in your desired subjects.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="07X XXX XXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-3">
                <Label>Select Subjects</Label>
                <div className="grid grid-cols-2 gap-3">
                  {subjects.map((subject) => (
                    <label
                      key={subject}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                        selected.includes(subject) ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"
                      }`}
                    >
                      <Checkbox
                        checked={selected.includes(subject)}
                        onCheckedChange={() => toggleSubject(subject)}
                      />
                      <span className="text-sm font-medium">{subject}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Register Now"}
              </Button>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>We'll reply within 24 hours after registration</span>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Register;
