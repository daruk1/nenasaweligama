import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bot, Send, X, Sparkles, GraduationCap, BookOpen, ImagePlus, Lightbulb } from "lucide-react";
import { toast } from "sonner";

type MessageContent =
  | string
  | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;

type Msg = { role: "user" | "assistant"; content: MessageContent; imagePreview?: string };

const GRADES = [
  "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11",
  "Grade 12", "Grade 13",
];

const SUBJECTS = [
  "Mathematics", "Science", "English", "Sinhala", "Tamil",
  "History", "Geography", "ICT", "Commerce", "Buddhism",
  "Physics", "Chemistry", "Biology", "Combined Maths",
];

const GUIDED_TOPICS: Record<string, string[]> = {
  Mathematics: ["Algebra basics", "Fractions & decimals", "Geometry shapes", "Equations solving"],
  Science: ["Human body systems", "Forces & motion", "Chemical reactions", "Ecosystems"],
  English: ["Grammar rules", "Essay writing tips", "Reading comprehension", "Vocabulary building"],
  Physics: ["Newton's laws", "Electricity & circuits", "Waves & optics", "Thermodynamics"],
  Chemistry: ["Periodic table", "Chemical bonding", "Acids & bases", "Organic chemistry"],
  Biology: ["Cell structure", "Photosynthesis", "Genetics basics", "Human anatomy"],
  "Combined Maths": ["Differentiation", "Integration", "Trigonometry", "Matrices"],
  History: ["Ancient civilizations", "Sri Lankan history", "World wars", "Independence movements"],
  Geography: ["Map reading", "Climate zones", "Natural disasters", "Sri Lankan geography"],
  ICT: ["Computer basics", "Programming concepts", "Internet safety", "Database basics"],
  Commerce: ["Business types", "Accounting basics", "Marketing concepts", "Banking & finance"],
  Buddhism: ["Noble truths", "Eightfold path", "Buddhist history", "Meditation concepts"],
  Sinhala: ["Grammar rules", "Literature analysis", "Essay writing", "Poetry appreciation"],
  Tamil: ["Grammar rules", "Literature analysis", "Essay writing", "Poetry appreciation"],
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/student-chat`;

async function streamChat({
  messages,
  grade,
  subject,
  onDelta,
  onDone,
}: {
  messages: Msg[];
  grade: string;
  subject: string;
  onDelta: (t: string) => void;
  onDone: () => void;
}) {
  // Convert messages to API format (strip imagePreview)
  const apiMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages: apiMessages, grade, subject }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `Error ${resp.status}`);
  }
  if (!resp.body) throw new Error("No response body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let done = false;

  while (!done) {
    const { done: d, value } = await reader.read();
    if (d) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || !line.trim()) continue;
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { done = true; break; }
      try {
        const p = JSON.parse(json);
        const c = p.choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch {
        buf = line + "\n" + buf;
        break;
      }
    }
  }
  onDone();
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 16) return "Good Afternoon";
  if (hour >= 16 && hour < 19) return "Good Evening";
  return "Good Night";
};

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const DarukAiWidget = () => {
  const [open, setOpen] = useState(false);
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [showGuided, setShowGuided] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const handleStart = () => {
    if (!grade) { toast.error("Please select your grade"); return; }
    if (!subject) { toast.error("Please select a subject"); return; }
    setStarted(true);
    setMessages([{
      role: "assistant",
      content: `👋 ${getGreeting()}! I'm **Daruk AI**.\n\nYou're studying **${subject}** in **${grade}**. Ask me anything!\n\n📸 You can **attach photos** of homework or questions!\n\n💡 Try the **Guided Learning** button for structured lessons.`,
    }]);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    const base64 = await fileToBase64(file);
    setAttachedImage(base64);
    e.target.value = "";
  };

  const handleGuidedTopic = (topic: string) => {
    setShowGuided(false);
    setInput(`Teach me about "${topic}" step by step. Start from the basics and build up. Include examples and practice questions.`);
  };

  const send = async () => {
    const text = input.trim();
    if ((!text && !attachedImage) || isLoading) return;

    let userContent: MessageContent;
    let imagePreview: string | undefined;

    if (attachedImage) {
      const parts: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [];
      if (text) parts.push({ type: "text", text });
      else parts.push({ type: "text", text: "Please look at this image and help me understand/solve it." });
      parts.push({ type: "image_url", image_url: { url: attachedImage } });
      userContent = parts;
      imagePreview = attachedImage;
    } else {
      userContent = text;
    }

    const userMsg: Msg = { role: "user", content: userContent, imagePreview };
    setInput("");
    setAttachedImage(null);
    setMessages((p) => [...p, userMsg]);
    setIsLoading(true);

    let assistant = "";
    const upsert = (chunk: string) => {
      assistant += chunk;
      setMessages((p) => {
        const last = p[p.length - 1];
        if (last?.role === "assistant" && p.length > 1) {
          return p.map((m, i) => (i === p.length - 1 ? { ...m, content: assistant } : m));
        }
        return [...p, { role: "assistant", content: assistant }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        grade,
        subject,
        onDelta: upsert,
        onDone: () => setIsLoading(false),
      });
    } catch (e: any) {
      setIsLoading(false);
      toast.error(e.message || "Failed to get response");
    }
  };

  const getDisplayText = (msg: Msg): string => {
    if (typeof msg.content === "string") return msg.content;
    const textPart = msg.content.find((p) => p.type === "text");
    return textPart ? (textPart as { type: "text"; text: string }).text : "";
  };

  const guidedTopics = GUIDED_TOPICS[subject] || ["Key concepts", "Practice problems", "Exam preparation", "Summary notes"];

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="group fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full liquid-glass-strong hover:scale-110 active:scale-95 transition-all duration-300"
          aria-label="Open Daruk AI"
        >
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-accent/40 via-accent/10 to-primary/30 opacity-80 group-hover:opacity-100 transition-opacity" />
          <span className="absolute inset-1 rounded-full bg-gradient-to-tr from-white/20 to-transparent" />
          <Bot className="relative h-7 w-7 text-accent-foreground drop-shadow-[0_2px_4px_hsl(var(--primary)/0.4)]" />
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-success ring-2 ring-background animate-pulse" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col w-[360px] h-[540px] rounded-3xl liquid-glass-strong overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Glossy top highlight */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/25 to-transparent" />
          {/* Header */}
          <div className="relative flex items-center justify-between px-4 py-3 bg-gradient-to-r from-accent/90 to-accent/70 backdrop-blur-xl border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <Bot className="h-4 w-4 text-accent-foreground" />
              </div>
              <span className="font-bold text-accent-foreground tracking-tight">Daruk AI</span>
              {started && (
                <span className="text-[10px] text-accent-foreground/80 font-medium">• {grade} • {subject}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {started && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-accent-foreground hover:bg-white/20 text-xs rounded-full"
                  onClick={() => { setStarted(false); setMessages([]); setAttachedImage(null); setShowGuided(false); }}
                >
                  Reset
                </Button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-accent-foreground hover:bg-white/20 rounded-full p-1.5 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!started ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/20">
                <Sparkles className="h-7 w-7 text-accent" />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-foreground">{getGreeting()}! 👋</h2>
                <p className="text-sm font-semibold text-accent mt-0.5">Daruk AI</p>
                <p className="text-xs text-muted-foreground mt-1">Your personal study assistant</p>
              </div>
              <div className="w-full space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" /> Grade
                  </label>
                  <Select value={grade} onValueChange={setGrade}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Choose…" /></SelectTrigger>
                    <SelectContent>
                      {GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1">
                    <BookOpen className="h-3 w-3" /> Subject
                  </label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Choose…" /></SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleStart} className="w-full gap-2" size="sm">
                <Sparkles className="h-4 w-4" /> Start Chatting
              </Button>
            </div>
          ) : (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-3" ref={scrollRef}>
                <div className="space-y-3">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed backdrop-blur-md border ${
                          m.role === "user"
                            ? "bg-primary/85 text-primary-foreground rounded-br-md border-white/10 shadow-lg shadow-primary/20"
                            : "bg-card/70 text-foreground rounded-bl-md border-white/20 shadow-sm"
                        }`}
                      >
                        {m.imagePreview && (
                          <img
                            src={m.imagePreview}
                            alt="Attached"
                            className="rounded-lg mb-1.5 max-h-32 w-auto object-cover"
                          />
                        )}
                        {m.role === "assistant" ? (
                          <div className="prose prose-xs dark:prose-invert max-w-none [&_p]:my-1 [&_li]:my-0.5 [&_ul]:my-1">
                            <ReactMarkdown>{getDisplayText(m)}</ReactMarkdown>
                          </div>
                        ) : (
                          getDisplayText(m)
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && messages[messages.length - 1]?.role === "user" && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-xl rounded-bl-sm px-3 py-2">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Guided Learning Panel */}
              {showGuided && (
                <div className="border-t px-3 py-2 bg-muted/50 space-y-1.5">
                  <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                    <Lightbulb className="h-3 w-3" /> Guided Learning — pick a topic:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {guidedTopics.map((topic) => (
                      <button
                        key={topic}
                        onClick={() => handleGuidedTopic(topic)}
                        className="text-[10px] px-2 py-1 rounded-full bg-accent/20 text-accent hover:bg-accent/30 transition-colors border border-accent/20"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Image Preview */}
              {attachedImage && (
                <div className="border-t px-3 py-2 flex items-center gap-2">
                  <img src={attachedImage} alt="Preview" className="h-10 w-10 rounded object-cover border" />
                  <span className="text-[10px] text-muted-foreground flex-1">Image attached</span>
                  <button onClick={() => setAttachedImage(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Input */}
              <div className="border-t p-3">
                <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handleImageSelect} />
                <form className="flex gap-1.5" onSubmit={(e) => { e.preventDefault(); send(); }}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => fileRef.current?.click()}
                    disabled={isLoading}
                    title="Attach image"
                  >
                    <ImagePlus className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={`h-9 w-9 shrink-0 ${showGuided ? "bg-accent/20" : ""}`}
                    onClick={() => setShowGuided(!showGuided)}
                    disabled={isLoading}
                    title="Guided Learning"
                  >
                    <Lightbulb className="h-4 w-4" />
                  </Button>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything…"
                    disabled={isLoading}
                    className="flex-1 h-9 text-sm"
                  />
                  <Button type="submit" disabled={isLoading || (!input.trim() && !attachedImage)} size="icon" className="h-9 w-9">
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default DarukAiWidget;
