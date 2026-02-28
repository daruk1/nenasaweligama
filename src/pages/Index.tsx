import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SubjectsSection from "@/components/SubjectsSection";
import PromoSection from "@/components/PromoSection";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main>
      <HeroSection />
      <SubjectsSection />
      <PromoSection />
    </main>
    <Footer />
  </div>
);

export default Index;
