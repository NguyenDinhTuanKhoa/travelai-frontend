import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TravelShowcase from './components/TravelShowcase';
import Destinations from './components/Destinations';
import Footer from './components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <TravelShowcase />
      <Destinations />
      <Footer />
    </main>
  );
}
