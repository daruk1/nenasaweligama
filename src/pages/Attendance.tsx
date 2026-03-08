import { useState, useCallback, useEffect, useRef } from "react";
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
import {
  CheckCircle2, XCircle, ScanLine, Upload, RefreshCw,
  Camera, List, QrCode, BookOpen,
} from "lucide-react";

const SUBJECTS = [
  { id: "english", label: "English", color: "bg-blue-500" },
  { id: "maths", label: "Mathematics", color: "bg-green-500" },
  { id: "science", label: "Science", color: "bg-purple-500" },
  { id: "ict", label: "ICT", color: "bg-orange-500" },
] as const;

type ScanStatus = "idle" | "success" | "error";

interface AttendanceRecord {
  id: string;
  student_id: string;
  student_name: string;
  subject: string;
  scanned_at: string;
}

const Attendance = () => {
  const [activeSubject, setActiveSubject] = useState<string>("english");
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [studentName, setStudentName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [activeTab, setActiveTab] = useState("scan");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split("T")[0];

  const markAttendance = useCallback(
    async (name: string, id: string, subject: string) => {
      if (processing) return;
      setProcessing(true);

      try {
        if (!name || !id) throw new Error("Invalid QR data");

        // Check for duplicate today
        const { data: existing } = await supabase
          .from("attendance")
          .select("id")
          .eq("student_id", id)
          .eq("subject", subject)
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
          .insert({ student_name: name, student_id: id, subject });

        if (error) throw error;

        setStudentName(name);
        setStatus("success");
        fetchRecords();
      } catch {
        setStatus("error");
      }

      setTimeout(() => { setStatus("idle"); setStudentName(""); setProcessing(false); }, 3000);
    },
    [processing, today]
  );

  // Handle scan result - supports both teacher scanning student QR and student scanning subject QR
  const handleScanResult = useCallback(
    async (qrText: string) => {
      if (!qrText || processing) return;
      try {
        const data = JSON.parse(qrText);

        // Case 1: Student QR scanned by teacher (has name + id)
        if (data.name && data.id) {
          await markAttendance(data.name, String(data.id), activeSubject);
          return;
        }

        // Case 2: Subject QR scanned by student (has subject + date)
        if (data.subject && data.type === "class_attendance") {
          // For student self-scan, we'd need auth - show error for now
          setStatus("error");
          setTimeout(() => { setStatus("idle"); setProcessing(false); }, 3000);
        }
      } catch {
        setStatus("error");
        setTimeout(() => { setStatus("idle"); setProcessing(false); }, 3000);
      }
    },
    [processing, markAttendance, activeSubject]
  );

  const handleLiveScan = useCallback(
    async (result: any) => {
      if (!result?.text) return;
      await handleScanResult(result.text);
    },
    [handleScanResult]
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

        await handleScanResult(code.data);
      } catch {
        setStatus("error");
        setTimeout(() => { setStatus("idle"); setProcessing(false); }, 3000);
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [processing, handleScanResult]
  );

  const fetchRecords = useCallback(async () => {
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
    fetchRecords();
  }, [fetchRecords]);

  const currentSubject = SUBJECTS.find((s) => s.id === activeSubject)!;

  // Generate subject QR data for students to scan
  const subjectQrData = JSON.stringify({
    type: "class_attendance",
    subject: activeSubject,
    date: today,
  });

  const StatusNotification = () => (
    <>
      {status === "success" && (
        <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl bg-green-600 p-8 text-white shadow-xl animate-in fade-in zoom-in-95">
          <CheckCircle2 className="h-16 w-16" />
          <span className="text-3xl font-bold">MARKED ✓</span>
          <span className="text-lg">{studentName}</span>
          <Badge className="bg-white/20 text-white text-sm">{currentSubject.label}</Badge>
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
        <h1 className="font-display text-3xl font-bold text-foreground">
          Class Attendance
        </h1>

        {/* Subject Selector */}
        <div className="flex flex-wrap justify-center gap-3">
          {SUBJECTS.map((sub) => (
            <Button
              key={sub.id}
              variant={activeSubject === sub.id ? "default" : "outline"}
              onClick={() => setActiveSubject(sub.id)}
              className="gap-2"
            >
              <BookOpen className="h-4 w-4" />
              {sub.label}
            </Button>
          ))}
        </div>

        <Badge variant="secondary" className="text-base px-4 py-1">
          📅 {new Date(today).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          {" — "}{currentSubject.label}
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
              Scan student QR code to mark attendance for <strong>{currentSubject.label}</strong>
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
              Upload a student QR image to mark for <strong>{currentSubject.label}</strong>
            </p>
            <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border p-10">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Select a QR code image (PNG, JPG)</p>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" id="qr-upload" />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={processing}>
                Choose Image
              </Button>
            </div>
            <StatusNotification />
          </TabsContent>

          {/* Class QR Code Tab */}
          <TabsContent value="qr" className="flex flex-col items-center gap-6">
            <p className="text-muted-foreground text-center">
              Display this QR code for <strong>{currentSubject.label}</strong> class. Students can scan it to check in.
            </p>
            <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-border p-8 bg-white shadow-lg">
              <QRCodeSVG value={subjectQrData} size={220} level="H" />
              <span className="text-lg font-bold text-gray-900">{currentSubject.label}</span>
              <span className="text-sm text-gray-500">{today}</span>
            </div>
          </TabsContent>

          {/* Records Tab */}
          <TabsContent value="records" className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                Today's {currentSubject.label} attendance
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
                    <TableHead>Student ID</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {loadingRecords ? "Loading..." : "No students scanned yet for today's " + currentSubject.label + " class."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((rec, i) => (
                      <TableRow key={rec.id}>
                        <TableCell className="font-medium">{i + 1}</TableCell>
                        <TableCell>{rec.student_name}</TableCell>
                        <TableCell>{rec.student_id}</TableCell>
                        <TableCell>{new Date(rec.scanned_at).toLocaleTimeString()}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800 border-green-300 gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Arrived
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <p className="text-xs text-muted-foreground text-right">
              Total arrived: {records.length} student{records.length !== 1 ? "s" : ""}
            </p>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Attendance;
