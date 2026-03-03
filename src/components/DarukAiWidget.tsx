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
import { Bot, Send, X, Sparkles, GraduationCap, BookOpen } from "lucide-react";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const GRADES = [
  "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11",
  "Grade 12", "Grade 13",
];

const SUBJECTS = [
  "Mathematics", "Science", "English", "Sinhala", "Tamil",
  "History", "Geography", "ICT", "Commerce", "Buddhism",
  "Physics", "Chemistry", "Biology", "Combined Maths",
];

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
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, grade, subject }),
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

const DarukAiWidget = () => {
  const [open, setOpen] = useState(false);
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      content: `👋 Hi! I'm **Daruk AI**.\n\nYou're studying **${subject}** in **${grade}**. Ask me anything!\n\n💡 Homework help, concept explanations, exam tips — I'm here for you.`,
    }]);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    const userMsg: Msg = { role: "user", content: text };
    setInput("");
    setMessages((p) => [...p, userMsg]);
    setIsLoading(true);

    let assistant = "";
    const upsert = (chunk: string) => {
      assistant += chunk;
      setMessages((p) => {
        const last = p[p.length - 1];
        if (last?.role === "assistant" && p.length > 1 && p[p.length - 2]?.content === text) {
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

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent shadow-lg hover:scale-105 transition-transform"
          aria-label="Open Daruk AI"
        >
          <Bot className="h-7 w-7 text-accent-foreground" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col w-[360px] h-[520px] rounded-2xl border bg-card shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between bg-accent px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-accent-foreground" />
              <span className="font-bold text-accent-foreground">Daruk AI</span>
              {started && (
                <span className="text-[10px] text-accent-foreground/70">• {grade} • {subject}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {started && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-accent-foreground hover:bg-accent-foreground/10 text-xs"
                  onClick={() => { setStarted(false); setMessages([]); }}
                >
                  Reset
                </Button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-accent-foreground hover:bg-accent-foreground/10 rounded p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!started ? (
            /* Setup view */
            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/20">
                <Sparkles className="h-7 w-7 text-accent" />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-foreground">Daruk AI</h2>
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
                        className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                          m.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted text-foreground rounded-bl-sm"
                        }`}
                      >
                        {m.role === "assistant" ? (
                          <div className="prose prose-xs dark:prose-invert max-w-none [&_p]:my-1 [&_li]:my-0.5 [&_ul]:my-1">
                            <ReactMarkdown>{m.content}</ReactMarkdown>
                          </div>
                        ) : m.content}
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

              {/* Input */}
              <div className="border-t p-3">
                <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything…"
                    disabled={isLoading}
                    className="flex-1 h-9 text-sm"
                  />
                  <Button type="submit" disabled={isLoading || !input.trim()} size="icon" className="h-9 w-9">
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
