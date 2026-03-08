import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { Download, QrCode, LogOut } from "lucide-react";

interface Registration {
  id: string;
  name: string;
  email: string;
  subjects: string[];
  grade: string | null;
  created_at: string;
}

const MyQR = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) navigate("/auth");
      else setUser(session.user);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      else setUser(session.user);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user?.email) return;
    const fetchRegistrations = async () => {
      const { data } = await supabase
        .from("registrations")
        .select("*")
        .eq("email", user.email)
        .order("created_at", { ascending: false });
      if (data) setRegistrations(data as Registration[]);
    };
    fetchRegistrations();
  }, [user]);

  const handleDownloadQR = (reg: Registration) => {
    const qrData = JSON.stringify({ name: reg.name, id: reg.id });
    const svg = document.getElementById(`qr-${reg.id}`)?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 700;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 600, 700);
      ctx.drawImage(img, 50, 30, 500, 500);
      ctx.fillStyle = "#000000";
      ctx.font = "bold 24px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(reg.name, 300, 580);
      ctx.font = "16px sans-serif";
      ctx.fillStyle = "#666666";
      ctx.fillText("Nenasa Education - Attendance QR", 300, 620);
      ctx.fillText(`ID: ${reg.id.slice(0, 8)}`, 300, 650);
      const link = document.createElement("a");
      link.download = `qr-${reg.name.replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
            <QrCode className="h-7 w-7 text-accent" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">My QR Codes</h1>
          <p className="mt-2 text-muted-foreground">Show your QR code to the teacher for attendance</p>
        </div>

        {registrations.length === 0 ? (
          <Card className="mx-auto max-w-md border-0 shadow-[var(--card-shadow)]">
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <QrCode className="h-12 w-12 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No registrations found for your account.</p>
              <Button onClick={() => navigate("/register")} className="bg-accent text-accent-foreground hover:bg-accent/90">
                Register for Classes
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
            {registrations.map((reg) => {
              const qrData = JSON.stringify({ name: reg.name, id: reg.id });
              return (
                <Card key={reg.id} className="border-0 shadow-[var(--card-shadow)]">
                  <CardContent className="flex flex-col items-center gap-4 py-8">
                    <div id={`qr-${reg.id}`} className="rounded-2xl border-2 border-accent/20 bg-card p-4">
                      <QRCodeSVG value={qrData} size={180} level="H" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{reg.name}</p>
                      <p className="text-xs text-muted-foreground">ID: {reg.id.slice(0, 8)}</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-1">
                      {reg.subjects.map((sub) => (
                        <Badge key={sub} variant="secondary" className="text-xs">{sub}</Badge>
                      ))}
                    </div>
                    <Button
                      onClick={() => handleDownloadQR(reg)}
                      variant="outline"
                      className="w-full gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download QR
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MyQR;