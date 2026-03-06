import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { UserPlus, Clock, CheckCircle, Mail, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import FadeIn from "@/components/FadeIn";
import englishPromo from "@/assets/english-promo.jpeg";
import englishPromo2028 from "@/assets/english-promo-2028.png";

const subjects = ["English", "Mathematics", "Science", "ICT"] as const;

const classes = [
  {
    id: "4-month-english",
    title: "4 Month English Programme",
    image: englishPromo,
    details: ["📍 NEW Nenasa - Weligama", "📅 Every Saturday, 6.00 PM - 8.00 PM"],
  },
  {
    id: "al-english-2028",
    title: "A/L General English 2028",
    subtitle: "Cool English For Your Future",
    image: englishPromo2028,
    details: ["📍 Art House - මාතර", "📅 මාර්තු 03 සිට සෑම අඟහරුවාදාම පෙ.ව. 10.30 ට"],
  },
] as const;

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        if (!name && session.user.user_metadata?.full_name) {
          setName(session.user.user_metadata.full_name);
        }
        if (!email && session.user.email) {
          setEmail(session.user.email);
        }
      }
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        if (!name && session.user.user_metadata?.full_name) {
          setName(session.user.user_metadata.full_name);
        }
        if (!email && session.user.email) {
          setEmail(session.user.email);
        }
      }
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const toggleClass = (classId: string) => {
    setSelected((prev) =>
      prev.includes(classId) ? prev.filter((s) => s !== classId) : [...prev, classId]
    );
  };

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (selected.length === 0 && selectedSubjects.length === 0) {
      toast.error("Please select at least one class or subject.");
      return;
    }

    const selectedClassNames = selected.map(
      (id) => classes.find((c) => c.id === id)?.title ?? id
    );
    const allSelections = [...selectedClassNames, ...selectedSubjects];

    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("send-registration-email", {
        body: { name, email, phone, subjects: allSelections },
      });
      if (error) throw error;
      setIsSubmitted(true);
      setPhone("");
      setSelected([]);
      setSelectedSubjects([]);
    } catch (err) {
      console.error("Registration error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

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
        <Card className="mx-auto max-w-2xl border-0 shadow-[var(--card-shadow)]">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
              <UserPlus className="h-6 w-6 text-accent" />
            </div>
            <CardTitle className="font-display text-2xl">Register for Classes</CardTitle>
            <CardDescription>
              Signed in as {user?.email}
              <button onClick={handleSignOut} className="ml-2 text-accent hover:underline inline-flex items-center gap-1">
                <LogOut className="h-3 w-3" /> Sign out
              </button>
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

              {/* Class selection with promo cards */}
              <div className="space-y-3">
                <Label>Select Classes</Label>
                <div className="grid gap-4">
                  {classes.map((cls, i) => (
                    <FadeIn key={cls.id} delay={150 * (i + 1)} direction="up">
                      <label
                        className={`group flex cursor-pointer gap-4 rounded-2xl border-2 p-3 transition-all duration-300 ${
                          selected.includes(cls.id)
                            ? "border-accent bg-accent/5 shadow-lg shadow-accent/10"
                            : "border-border hover:border-accent/40"
                        }`}
                      >
                        <div className="flex-shrink-0 pt-1">
                          <Checkbox
                            checked={selected.includes(cls.id)}
                            onCheckedChange={() => toggleClass(cls.id)}
                          />
                        </div>
                        <div className="flex flex-1 flex-col sm:flex-row gap-4">
                          <div className="overflow-hidden rounded-xl flex-shrink-0">
                            <img
                              src={cls.image}
                              alt={cls.title}
                              className="h-28 w-full sm:w-40 object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-display text-base font-bold text-foreground">{cls.title}</h3>
                            {"subtitle" in cls && cls.subtitle && (
                              <p className="text-xs font-semibold text-accent mt-0.5">{cls.subtitle}</p>
                            )}
                            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                              {cls.details.map((d) => <li key={d}>{d}</li>)}
                              <li>📞 077 50 79 170</li>
                            </ul>
                          </div>
                        </div>
                      </label>
                    </FadeIn>
                  ))}
                </div>
              </div>

              {/* Subject selection */}
              <div className="space-y-3">
                <Label>Select Subjects</Label>
                <div className="grid grid-cols-2 gap-3">
                  {subjects.map((subject) => (
                    <label
                      key={subject}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                        selectedSubjects.includes(subject) ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"
                      }`}
                    >
                      <Checkbox
                        checked={selectedSubjects.includes(subject)}
                        onCheckedChange={() => toggleSubject(subject)}
                      />
                      <span className="text-sm font-medium">{subject}</span>
                    </label>
                  ))}
                </div>
              </div>

                <Button
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
