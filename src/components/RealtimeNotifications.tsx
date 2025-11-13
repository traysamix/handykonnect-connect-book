import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Bell } from 'lucide-react';

const RealtimeNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('booking-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `client_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const newStatus = payload.new.status;
            const oldStatus = payload.old?.status;

            if (newStatus !== oldStatus) {
              toast({
                title: 'Booking Update',
                description: `Your booking status has been updated to: ${newStatus}`,
                action: (
                  <Bell className="h-4 w-4" />
                ),
              });
            }
          } else if (payload.eventType === 'INSERT') {
            toast({
              title: 'New Booking',
              description: 'Your booking has been created successfully!',
              action: (
                <Bell className="h-4 w-4" />
              ),
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  return null;
};

export default RealtimeNotifications;
