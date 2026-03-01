import { useState, useCallback } from "react";
import { QrReader } from "react-qr-reader";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle2, XCircle, ScanLine } from "lucide-react";

type ScanStatus = "idle" | "success" | "error";

const Attendance = () => {
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [studentName, setStudentName] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleScan = useCallback(
    async (result: any) => {
      if (!result?.text || processing) return;

      setProcessing(true);

      try {
        const data = JSON.parse(result.text);
        const name = data.name;
        const id = String(data.id);

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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="container mx-auto flex flex-1 flex-col items-center gap-6 px-4 py-10">
        <h1 className="font-display text-3xl font-bold text-foreground">
          QR Attendance Scanner
        </h1>
        <p className="text-muted-foreground">
          Point the camera at a student QR code to mark attendance.
        </p>

        {/* Scanner */}
        <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border-2 border-border shadow-lg">
          <QrReader
            constraints={{ facingMode: "environment" }}
            onResult={handleScan}
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

        {/* Status overlay */}
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
      </main>

      <Footer />
    </div>
  );
};

export default Attendance;
