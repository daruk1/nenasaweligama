import { useState, useCallback, useEffect, useRef } from "react";
import { QrReader } from "react-qr-reader";
import jsQR from "jsqr";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  XCircle,
  ScanLine,
  Upload,
  RefreshCw,
  Camera,
  List,
} from "lucide-react";

type ScanStatus = "idle" | "success" | "error";

interface AttendanceRecord {
  id: string;
  student_id: string;
  student_name: string;
  scanned_at: string;
}

const Attendance = () => {
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [studentName, setStudentName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const markAttendance = useCallback(
    async (name: string, id: string) => {
      if (processing) return;
      setProcessing(true);

      try {
        if (!name || !id) throw new Error("Invalid QR data");

        const { error } = await supabase
          .from("attendance")
          .insert({ student_name: name, student_id: id });

        if (error) throw error;

        setStudentName(name);
        setStatus("success");
      } catch {
        setStatus("error");
      }

      setTimeout(() => {
        setStatus("idle");
        setStudentName("");
        setProcessing(false);
      }, 3000);
    },
    [processing]
  );

  // Live camera scan handler
  const handleLiveScan = useCallback(
    async (result: any) => {
      if (!result?.text || processing) return;
      try {
        const data = JSON.parse(result.text);
        await markAttendance(data.name, String(data.id));
      } catch {
        setStatus("error");
        setTimeout(() => {
          setStatus("idle");
          setProcessing(false);
        }, 3000);
      }
    },
    [processing, markAttendance]
  );

  // Upload QR image handler
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
          img.onerror = () => reject(new Error("Failed to load image"));
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
        await markAttendance(data.name, String(data.id));
      } catch {
        setStatus("error");
        setTimeout(() => {
          setStatus("idle");
          setProcessing(false);
        }, 3000);
      }

      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [processing, markAttendance]
  );

  // Fetch records
  const fetchRecords = useCallback(async () => {
    setLoadingRecords(true);
    const { data } = await supabase
      .from("attendance")
      .select("*")
      .order("scanned_at", { ascending: false });
    if (data) setRecords(data as AttendanceRecord[]);
    setLoadingRecords(false);
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Status notification component
  const StatusNotification = () => (
    <>
      {status === "success" && (
        <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl bg-green-600 p-8 text-white shadow-xl animate-in fade-in zoom-in-95">
          <CheckCircle2 className="h-16 w-16" />
          <span className="text-3xl font-bold">SUCCESS</span>
          <span className="text-lg">{studentName}</span>
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
          QR Attendance Scanner
        </h1>

        <Tabs defaultValue="live" className="w-full max-w-2xl">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="live" className="gap-2">
              <Camera className="h-4 w-4" />
              Live Scan
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload QR
            </TabsTrigger>
            <TabsTrigger value="records" className="gap-2" onClick={fetchRecords}>
              <List className="h-4 w-4" />
              Records
            </TabsTrigger>
          </TabsList>

          {/* Live Scan Tab */}
          <TabsContent value="live" className="flex flex-col items-center gap-6">
            <p className="text-muted-foreground">
              Point the camera at a student QR code to mark attendance.
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
            <p className="text-muted-foreground">
              Upload a QR code image to mark attendance.
            </p>
            <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border p-10">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Select a QR code image (PNG, JPG)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="qr-upload"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={processing}
              >
                Choose Image
              </Button>
            </div>
            <StatusNotification />
          </TabsContent>

          {/* Records Tab */}
          <TabsContent value="records" className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                All scanned attendance records
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchRecords}
                disabled={loadingRecords}
                className="gap-2"
              >
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
                    <TableHead>Scanned At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        {loadingRecords ? "Loading..." : "No attendance records yet."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((rec, i) => (
                      <TableRow key={rec.id}>
                        <TableCell className="font-medium">{i + 1}</TableCell>
                        <TableCell>{rec.student_name}</TableCell>
                        <TableCell>{rec.student_id}</TableCell>
                        <TableCell>
                          {new Date(rec.scanned_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <p className="text-xs text-muted-foreground text-right">
              Total: {records.length} record{records.length !== 1 ? "s" : ""}
            </p>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Attendance;
