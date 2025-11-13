import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface RefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId: string;
  bookingId: string;
  amount: number;
  onSuccess: () => void;
}

const RefundDialog = ({ open, onOpenChange, paymentId, bookingId, amount, onSuccess }: RefundDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleRefund = async () => {
    setLoading(true);

    try {
      // Update payment status to refunded
      const { error: paymentError } = await supabase
        .from('payments')
        .update({ status: 'refunded' })
        .eq('id', paymentId);

      if (paymentError) throw paymentError;

      // Update booking status to cancelled
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (bookingError) throw bookingError;

      toast({
        title: 'Refund Processed',
        description: `Successfully refunded $${amount} to the customer.`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error processing refund:', error);
      toast({
        title: 'Refund Failed',
        description: error.message || 'Failed to process refund. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Process Refund</DialogTitle>
          <DialogDescription>
            Are you sure you want to refund ${amount} to the customer? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRefund}
            className="flex-1"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm Refund'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RefundDialog;
