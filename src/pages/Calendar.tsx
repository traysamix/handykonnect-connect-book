import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Calendar as BigCalendar, momentLocalizer, Event } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card } from '@/components/ui/card';

const localizer = momentLocalizer(moment);

interface BookingEvent {
  id: string;
  title?: string;
  start: Date;
  end: Date;
  service: any;
  client: any;
  address: string;
  status: string;
}

const Calendar = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      fetchBookings();
    }
  }, [profile]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user?.id)
      .single();
    setProfile(data);
  };

  const fetchBookings = async () => {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        service:services(*),
        client:profiles(*)
      `)
      .order('scheduled_date', { ascending: true });

    // If client, only show their bookings
    if (profile?.role === 'client') {
      query = query.eq('client_id', user?.id);
    }

    const { data } = await query;

    if (data) {
      const calendarEvents: BookingEvent[] = data.map((booking) => {
        const startDate = new Date(booking.scheduled_date);
        const endDate = new Date(startDate.getTime() + booking.service.duration_minutes * 60000);

        return {
          id: booking.id,
          title: `${booking.service.name} - ${booking.client.full_name}`,
          start: startDate,
          end: endDate,
          service: booking.service,
          client: booking.client,
          address: booking.address,
          status: booking.status,
        };
      });

      setEvents(calendarEvents);
    }
  };

  const eventStyleGetter = (event: BookingEvent) => {
    let backgroundColor = '#3174ad';
    
    switch (event.status) {
      case 'pending':
        backgroundColor = '#f59e0b';
        break;
      case 'confirmed':
        backgroundColor = '#3b82f6';
        break;
      case 'in_progress':
        backgroundColor = '#8b5cf6';
        break;
      case 'completed':
        backgroundColor = '#10b981';
        break;
      case 'cancelled':
        backgroundColor = '#ef4444';
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  if (loading || !profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Booking Calendar</h1>
          <p className="text-muted-foreground">
            {profile.role === 'admin' 
              ? 'View all scheduled appointments' 
              : 'View your scheduled appointments'}
          </p>
        </div>

        <Card className="p-6">
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 700 }}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={(event) => {
              const bookingEvent = event as BookingEvent;
              alert(`
Service: ${bookingEvent.service.name}
Client: ${bookingEvent.client.full_name}
Address: ${bookingEvent.address}
Status: ${bookingEvent.status}
Time: ${moment(bookingEvent.start).format('MMMM Do YYYY, h:mm a')}
              `);
            }}
          />
        </Card>

        <div className="mt-4 flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
            <span className="text-sm">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
            <span className="text-sm">Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#8b5cf6' }}></div>
            <span className="text-sm">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
            <span className="text-sm">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
            <span className="text-sm">Cancelled</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
