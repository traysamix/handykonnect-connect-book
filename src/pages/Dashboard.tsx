import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BookingDialog from '@/components/BookingDialog';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchBookings();
    }
  }, [user]);

  useEffect(() => {
    const bookServiceId = searchParams.get('book');
    if (bookServiceId) {
      setSelectedServiceId(bookServiceId);
      setBookDialogOpen(true);
    }
  }, [searchParams]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();
    setProfile(data);
  };

  const fetchBookings = async () => {
    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        service:services(*),
        payment:payments(*)
      `)
      .eq('client_id', user?.id)
      .order('scheduled_date', { ascending: false });
    
    if (data) {
      setBookings(data);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-blue-500',
      in_progress: 'bg-purple-500',
      completed: 'bg-green-500',
      cancelled: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (profile?.role === 'admin') {
    navigate('/admin');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back, {profile?.full_name}</h1>
          <p className="text-muted-foreground">Manage your bookings and profile</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Your Bookings</CardTitle>
                  <CardDescription>View and manage your service appointments</CardDescription>
                </div>
                <Button onClick={() => navigate('/')}>Book New Service</Button>
              </div>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No bookings yet. Book your first service!
                </p>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <Card key={booking.id} className="bg-gradient-card">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{booking.service.name}</h3>
                              <Badge className={getStatusColor(booking.status)}>
                                {booking.status}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(booking.scheduled_date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{new Date(booking.scheduled_date).toLocaleTimeString()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{booking.address}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                <span>${booking.service.price}</span>
                              </div>
                            </div>
                            {booking.notes && (
                              <p className="text-sm mt-2"><strong>Notes:</strong> {booking.notes}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <BookingDialog
        open={bookDialogOpen}
        onOpenChange={setBookDialogOpen}
        serviceId={selectedServiceId}
        onSuccess={() => {
          fetchBookings();
          toast({
            title: 'Success',
            description: 'Booking created successfully!'
          });
        }}
      />
    </div>
  );
};

export default Dashboard;
