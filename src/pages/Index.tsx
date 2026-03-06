import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SubjectsSection from "@/components/SubjectsSection";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main>
      <HeroSection />
      <SubjectsSection />
    </main>
    <Footer />
  </div>
);

export default Index;
