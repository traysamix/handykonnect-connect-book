import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Wrench, Calendar, DollarSign } from 'lucide-react';
import ServiceManagement from '@/components/ServiceManagement';
import AdminChat from '@/components/AdminChat';
import TransactionMonitor from '@/components/TransactionMonitor';
import AdminInvitations from '@/components/AdminInvitations';

const Admin = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    totalClients: 0,
    totalServices: 0
  });
  const [bookings, setBookings] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (!loading && user && !isAdmin) {
      navigate('/dashboard');
    } else if (user && isAdmin) {
      fetchStats();
      fetchBookings();
      fetchClients();
    }
  }, [user, loading, isAdmin, navigate]);

  const fetchStats = async () => {
    const [bookingsRes, paymentsRes, clientsRes, servicesRes] = await Promise.all([
      supabase.from('bookings').select('id', { count: 'exact' }),
      supabase.from('payments').select('amount').eq('status', 'completed'),
      supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'client'),
      supabase.from('services').select('id', { count: 'exact' })
    ]);

    const totalRevenue = paymentsRes.data?.reduce((sum, payment) => sum + parseFloat(payment.amount.toString()), 0) || 0;

    setStats({
      totalBookings: bookingsRes.count || 0,
      totalRevenue,
      totalClients: clientsRes.count || 0,
      totalServices: servicesRes.count || 0
    });
  };

  const fetchBookings = async () => {
    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        service:services(*),
        client:profiles(*)
      `)
      .order('scheduled_date', { ascending: false })
      .limit(10);
    
    if (data) {
      setBookings(data);
    }
  };

  const fetchClients = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'client')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data) {
      setClients(data);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled') => {
    await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId);
    fetchBookings();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage services, bookings, and clients</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClients}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Services</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalServices}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="bookings" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="invitations">Admins</TabsTrigger>
            <TabsTrigger value="chat">Support Chat</TabsTrigger>
          </TabsList>
          
          <TabsContent value="transactions" className="space-y-4">
            <TransactionMonitor />
          </TabsContent>

          <TabsContent value="invitations" className="space-y-4">
            <AdminInvitations />
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
                <CardDescription>Manage and update booking statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <Card key={booking.id} className="bg-gradient-card">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{booking.service.name}</h3>
                              <Badge>{booking.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Client: {booking.client.full_name} ({booking.client.email})
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Date: {new Date(booking.scheduled_date).toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Address: {booking.address}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {booking.status === 'pending' && (
                              <Button size="sm" onClick={() => updateBookingStatus(booking.id, 'confirmed')}>
                                Confirm
                              </Button>
                            )}
                            {booking.status === 'confirmed' && (
                              <Button size="sm" onClick={() => updateBookingStatus(booking.id, 'in_progress')}>
                                Start
                              </Button>
                            )}
                            {booking.status === 'in_progress' && (
                              <Button size="sm" onClick={() => updateBookingStatus(booking.id, 'completed')}>
                                Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="clients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Client List</CardTitle>
                <CardDescription>View all registered clients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clients.map((client) => (
                    <Card key={client.id} className="bg-gradient-card">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{client.full_name}</h3>
                            <p className="text-sm text-muted-foreground">{client.email}</p>
                            <p className="text-sm text-muted-foreground">
                              Joined: {new Date(client.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <ServiceManagement />
          </TabsContent>

          <TabsContent value="chat">
            <AdminChat />
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
};

export default Admin;
