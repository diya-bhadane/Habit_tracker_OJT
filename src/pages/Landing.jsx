import Hero from "../components/Hero";
import Features from "../components/Features";
import Testimonials from "../components/Testimonials";
import CTA from "../components/CTA";
import FAQ from "../components/FAQ";
import Footer from "../components/Footer";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#f5f7ff]">
      <Hero />

      <main className="max-w-6xl mx-auto px-6 md:px-10">
        <Features />
        <Testimonials />
        <CTA />
        <FAQ />
      </main>

      <Footer />
    </div>
  );
}
