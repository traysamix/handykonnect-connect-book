import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: string | null;
  onSuccess: () => void;
}

const BookingDialog = ({ open, onOpenChange, serviceId, onSuccess }: BookingDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [service, setService] = useState<any>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (serviceId) {
      fetchService();
    }
  }, [serviceId]);

  const fetchService = async () => {
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single();
    setService(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !serviceId) return;

    setLoading(true);
    const { error } = await supabase
      .from('bookings')
      .insert({
        client_id: user.id,
        service_id: serviceId,
        scheduled_date: scheduledDate,
        address,
        notes,
        status: 'pending'
      });

    setLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      onSuccess();
      onOpenChange(false);
      setScheduledDate('');
      setAddress('');
      setNotes('');
    }
  };

  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book {service.name}</DialogTitle>
          <DialogDescription>
            Fill in the details to schedule your appointment
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date & Time</Label>
            <Input
              id="date"
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Service Address</Label>
            <Input
              id="address"
              type="text"
              placeholder="123 Main St, City, State"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any specific requirements or details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Cost:</span>
              <span className="text-2xl font-bold text-primary">${service.price}</span>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating Booking...' : 'Confirm Booking'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;
