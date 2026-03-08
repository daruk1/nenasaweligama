import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { QrReader } from "react-qr-reader";
import jsQR from "jsqr";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  CheckCircle2, XCircle, ScanLine, Upload, RefreshCw,
  Camera, List, QrCode, BookOpen, LogOut, ShieldCheck, Lock,
} from "lucide-react";

type ScanStatus = "idle" | "success" | "error";

interface AttendanceRecord {
  id: string;
  student_id: string;
  student_name: string;
  subject: string;
  scanned_at: string;
}

interface RegisteredStudent {
  id: string;
  name: string;
  email: string;
  phone: string;
  subjects: string[];
}

const Attendance = () => {
  const [adminVerified, setAdminVerified] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState<string>("");
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [studentName, setStudentName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [registeredStudents, setRegisteredStudents] = useState<RegisteredStudent[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [activeTab, setActiveTab] = useState("scan");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const today = new Date().toISOString().split("T")[0];

  // Auth check
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      else setUser(session.user);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  // Fetch registered subjects & students
  useEffect(() => {
    const fetchRegistrations = async () => {
      const { data } = await supabase.from("registrations").select("*");
      if (!data) return;

      const students = data as RegisteredStudent[];
      setRegisteredStudents(students);

      // Extract unique subjects from all registrations
      const allSubjects = new Set<string>();
      students.forEach((s) => s.subjects?.forEach((sub) => allSubjects.add(sub)));
      const sorted = Array.from(allSubjects).sort();
      setAvailableSubjects(sorted);
      if (sorted.length > 0 && !activeSubject) setActiveSubject(sorted[0]);
    };
    if (user) fetchRegistrations();
  }, [user]);

  // Students registered for the active subject
  const subjectStudents = registeredStudents.filter(
    (s) => s.subjects?.includes(activeSubject)
  );

  const markAttendance = useCallback(
    async (name: string, id: string) => {
      if (processing || !activeSubject) return;
      setProcessing(true);

      try {
        if (!name || !id) throw new Error("Invalid QR data");

        // Duplicate check for today
        const { data: existing } = await supabase
          .from("attendance")
          .select("id")
          .eq("student_id", id)
          .eq("subject", activeSubject)
          .gte("scanned_at", today + "T00:00:00")
          .lte("scanned_at", today + "T23:59:59");

        if (existing && existing.length > 0) {
          setStudentName(name + " (already marked)");
          setStatus("success");
          setTimeout(() => { setStatus("idle"); setStudentName(""); setProcessing(false); }, 3000);
          return;
        }

        const { error } = await supabase
          .from("attendance")
          .insert({ student_name: name, student_id: id, subject: activeSubject });

        if (error) throw error;

        setStudentName(name);
        setStatus("success");
        fetchRecords();
      } catch {
        setStatus("error");
      }

      setTimeout(() => { setStatus("idle"); setStudentName(""); setProcessing(false); }, 3000);
    },
    [processing, activeSubject, today]
  );

  const handleLiveScan = useCallback(
    async (result: any) => {
      if (!result?.text || processing) return;
      try {
        const data = JSON.parse(result.text);
        if (data.name && data.id) {
          await markAttendance(data.name, String(data.id));
        }
      } catch {
        setStatus("error");
        setTimeout(() => { setStatus("idle"); setProcessing(false); }, 3000);
      }
    },
    [processing, markAttendance]
  );

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || processing) return;

      try {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.src = url;
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject();
        });
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);

        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (!code?.data) throw new Error("No QR code found");

        const data = JSON.parse(code.data);
        if (data.name && data.id) {
          await markAttendance(data.name, String(data.id));
        }
      } catch {
        setStatus("error");
        setTimeout(() => { setStatus("idle"); setProcessing(false); }, 3000);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [processing, markAttendance]
  );

  const fetchRecords = useCallback(async () => {
    if (!activeSubject) return;
    setLoadingRecords(true);
    const { data } = await supabase
      .from("attendance")
      .select("*")
      .eq("subject", activeSubject)
      .gte("scanned_at", today + "T00:00:00")
      .order("scanned_at", { ascending: false });
    if (data) setRecords(data as AttendanceRecord[]);
    setLoadingRecords(false);
  }, [activeSubject, today]);

  useEffect(() => {
    if (activeSubject) fetchRecords();
  }, [fetchRecords, activeSubject]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleAdminVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setAdminError("");
    try {
      const { data, error } = await supabase.functions.invoke("verify-admin", {
        body: { code: adminCode },
      });
      if (error || !data?.valid) {
        setAdminError("Invalid admin code. Access denied.");
      } else {
        setAdminVerified(true);
      }
    } catch {
      setAdminError("Verification failed. Try again.");
    }
    setVerifying(false);
  };

  // Build attendance status list: who arrived, who didn't
  const arrivedIds = new Set(records.map((r) => r.student_id));
  const attendanceList = subjectStudents.map((s) => ({
    ...s,
    arrived: arrivedIds.has(s.id),
    scannedAt: records.find((r) => r.student_id === s.id)?.scanned_at,
  }));

  const subjectQrData = JSON.stringify({
    type: "class_attendance",
    subject: activeSubject,
    date: today,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  const StatusNotification = () => (
    <>
      {status === "success" && (
        <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl bg-green-600 p-8 text-white shadow-xl animate-in fade-in zoom-in-95">
          <CheckCircle2 className="h-16 w-16" />
          <span className="text-3xl font-bold">MARKED ✓</span>
          <span className="text-lg">{studentName}</span>
          <Badge className="bg-white/20 text-white text-sm">{activeSubject}</Badge>
        </div>
      )}
      {status === "error" && (
        <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl bg-destructive p-8 text-destructive-foreground shadow-xl animate-in fade-in zoom-in-95">
          <XCircle className="h-16 w-16" />
          <span className="text-3xl font-bold">ERROR</span>
          <span className="text-lg">Invalid QR code or scan failed</span>
        </div>
      )}
    </>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="container mx-auto flex flex-1 flex-col items-center gap-6 px-4 py-10">
        {!adminVerified ? (
          /* Admin Code Gate */
          <Card className="w-full max-w-md border-0 shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                <Lock className="h-7 w-7 text-accent" />
              </div>
              <CardTitle className="font-display text-2xl">Admin Access</CardTitle>
              <CardDescription>Enter the admin code to access the attendance panel</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminVerify} className="space-y-4">
                <Input
                  type="password"
                  placeholder="Enter admin code"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  required
                />
                {adminError && (
                  <p className="text-sm text-destructive text-center">{adminError}</p>
                )}
                <Button
                  type="submit"
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold gap-2"
                  disabled={verifying}
                >
                  <ShieldCheck className="h-4 w-4" />
                  {verifying ? "Verifying..." : "Enter Admin Panel"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* Admin Panel Content */
          <>
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-accent" />
          <h1 className="font-display text-3xl font-bold text-foreground">
            Teacher Attendance Panel
          </h1>
        </div>

        {availableSubjects.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No registered classes yet</p>
            <p className="text-sm">Students need to register for subjects first.</p>
          </div>
        ) : (
          <>
            {/* Subject Selector - only registered subjects */}
            <div className="flex flex-wrap justify-center gap-3">
              {availableSubjects.map((sub) => (
                <Button
                  key={sub}
                  variant={activeSubject === sub ? "default" : "outline"}
                  onClick={() => setActiveSubject(sub)}
                  className="gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  {sub}
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {registeredStudents.filter((s) => s.subjects?.includes(sub)).length}
                  </Badge>
                </Button>
              ))}
            </div>

            <Badge variant="secondary" className="text-base px-4 py-1">
              📅 {new Date(today).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              {" — "}{activeSubject}
            </Badge>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-2xl">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="scan" className="gap-2">
                  <Camera className="h-4 w-4" />
                  Scan
                </TabsTrigger>
                <TabsTrigger value="upload" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="qr" className="gap-2">
                  <QrCode className="h-4 w-4" />
                  Class QR
                </TabsTrigger>
                <TabsTrigger value="records" className="gap-2" onClick={fetchRecords}>
                  <List className="h-4 w-4" />
                  Records
                </TabsTrigger>
              </TabsList>

              {/* Live Scan Tab */}
              <TabsContent value="scan" className="flex flex-col items-center gap-6">
                <p className="text-muted-foreground text-center">
                  Scan student QR code to mark attendance for <strong>{activeSubject}</strong>
                </p>
                <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border-2 border-border shadow-lg">
                  <QrReader
                    constraints={{ facingMode: "environment" }}
                    onResult={handleLiveScan}
                    scanDelay={1000}
                    containerStyle={{ width: "100%" }}
                    videoStyle={{ borderRadius: "1rem" }}
                  />
                  {status === "idle" && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <ScanLine className="h-16 w-16 animate-pulse text-accent opacity-60" />
                    </div>
                  )}
                </div>
                <StatusNotification />
              </TabsContent>

              {/* Upload QR Tab */}
              <TabsContent value="upload" className="flex flex-col items-center gap-6">
                <p className="text-muted-foreground text-center">
                  Upload a student QR image to mark for <strong>{activeSubject}</strong>
                </p>
                <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border p-10">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Select a QR code image (PNG, JPG)</p>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={processing}>
                    Choose Image
                  </Button>
                </div>
                <StatusNotification />
              </TabsContent>

              {/* Class QR Code Tab */}
              <TabsContent value="qr" className="flex flex-col items-center gap-6">
                <p className="text-muted-foreground text-center">
                  QR code for <strong>{activeSubject}</strong> class today
                </p>
                <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-border p-8 bg-card shadow-lg">
                  <QRCodeSVG value={subjectQrData} size={220} level="H" />
                  <span className="text-lg font-bold text-foreground">{activeSubject}</span>
                  <span className="text-sm text-muted-foreground">{today}</span>
                </div>
              </TabsContent>

              {/* Records Tab - Shows arrived & not arrived */}
              <TabsContent value="records" className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">
                    {activeSubject} — {attendanceList.filter((s) => s.arrived).length}/{subjectStudents.length} arrived
                  </p>
                  <Button variant="outline" size="sm" onClick={fetchRecords} disabled={loadingRecords} className="gap-2">
                    <RefreshCw className={`h-4 w-4 ${loadingRecords ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>

                <div className="rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjectStudents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            {loadingRecords ? "Loading..." : "No students registered for " + activeSubject + "."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        attendanceList.map((student, i) => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">{i + 1}</TableCell>
                            <TableCell>{student.name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{student.email}</TableCell>
                            <TableCell>
                              {student.scannedAt
                                ? new Date(student.scannedAt).toLocaleTimeString()
                                : "—"}
                            </TableCell>
                            <TableCell>
                              {student.arrived ? (
                                <Badge className="bg-green-100 text-green-800 border-green-300 gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> Arrived
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="gap-1">
                                  <XCircle className="h-3 w-3" /> Not Arrived
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    ✅ {attendanceList.filter((s) => s.arrived).length} arrived
                  </span>
                  <span>
                    ❌ {attendanceList.filter((s) => !s.arrived).length} not arrived
                  </span>
                  <span>
                    Total: {subjectStudents.length} student{subjectStudents.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Attendance;
