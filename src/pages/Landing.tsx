import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import ServiceCard from '@/components/ServiceCard';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import heroBanner from '@/assets/hero-banner.jpg';
import plumbingImg from '@/assets/plumbing.jpg';
import electricalImg from '@/assets/electrical.jpg';
import carpentryImg from '@/assets/carpentry.jpg';
import paintingImg from '@/assets/painting.jpg';
import hvacImg from '@/assets/hvac.jpg';
import applianceImg from '@/assets/appliance.jpg';

const imageMap: Record<string, string> = {
  'Plumbing Repair': plumbingImg,
  'Electrical Work': electricalImg,
  'Carpentry': carpentryImg,
  'Painting': paintingImg,
  'HVAC Maintenance': hvacImg,
  'Appliance Repair': applianceImg,
};

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (!error && data) {
      setServices(data);
    }
  };

  const handleBookService = (serviceId: string) => {
    if (user) {
      navigate(`/dashboard?book=${serviceId}`);
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[500px] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBanner})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
        </div>
        <div className="relative z-10 text-center text-primary-foreground px-4 max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Professional Handyman Services
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90">
            Quality repairs and maintenance for your home and business
          </p>
          {!user && (
            <Button size="lg" variant="secondary" onClick={() => navigate('/auth')}>
              Get Started Today
            </Button>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Licensed Professionals', description: 'All our handymen are licensed and insured' },
              { title: 'Same-Day Service', description: 'Quick response times for urgent repairs' },
              { title: 'Satisfaction Guaranteed', description: 'We stand behind our work 100%' }
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <CheckCircle className="h-8 w-8 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Services</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From plumbing to electrical work, we've got all your home repair needs covered
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                id={service.id}
                name={service.name}
                description={service.description}
                price={parseFloat(service.price)}
                duration={service.duration_minutes}
                imageUrl={imageMap[service.name] || plumbingImg}
                onBook={() => handleBookService(service.id)}
                isLoggedIn={!!user}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-16 bg-gradient-hero text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-8 opacity-90">
              Create an account and book your first service today
            </p>
            <Button size="lg" variant="secondary" onClick={() => navigate('/auth')}>
              Sign Up Now
            </Button>
          </div>
        </section>
      )}
    </div>
  );
};

export default Landing;
