import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PaymentForm from '@/components/PaymentForm';

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
  const [showPayment, setShowPayment] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

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
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        client_id: user.id,
        service_id: serviceId,
        scheduled_date: scheduledDate,
        address,
        notes,
        status: 'pending'
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      // Send confirmation email
      await supabase.functions.invoke('send-booking-email', {
        body: { bookingId: data.id, type: 'confirmation' },
      });

      setBookingId(data.id);
      setShowPayment(true);
    }
  };

  const handlePaymentSuccess = () => {
    toast({
      title: 'Success',
      description: 'Your booking has been confirmed and payment processed!',
    });
    onSuccess();
    onOpenChange(false);
    setScheduledDate('');
    setAddress('');
    setNotes('');
    setShowPayment(false);
    setBookingId(null);
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setBookingId(null);
  };

  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book {service.name}</DialogTitle>
          <DialogDescription>
            {showPayment ? 'Complete your payment' : 'Fill in the details to schedule your appointment'}
          </DialogDescription>
        </DialogHeader>
        {!showPayment ? (
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
              {loading ? 'Creating Booking...' : 'Continue to Payment'}
            </Button>
          </form>
        ) : (
          bookingId && (
            <PaymentForm
              bookingId={bookingId}
              amount={parseFloat(service.price)}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          )
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;
