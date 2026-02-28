import Navbar from "@/components/Navbar";
import SubjectsSection from "@/components/SubjectsSection";
import Footer from "@/components/Footer";

const Subjects = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="pt-8">
      <SubjectsSection />
    </main>
    <Footer />
  </div>
);

export default Subjects;
