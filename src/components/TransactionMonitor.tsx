import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, X, Clock } from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  booking_id: string;
  booking: {
    scheduled_date: string;
    address: string;
    client: {
      full_name: string;
      email: string;
    };
    service: {
      name: string;
    };
  };
}

const TransactionMonitor = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
    subscribeToPayments();
  }, []);

  const fetchPayments = async () => {
    const { data } = await supabase
      .from('payments')
      .select(`
        *,
        booking:bookings(
          scheduled_date,
          address,
          service:services(name),
          client:profiles!client_id(full_name, email)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setPayments(data as any);
    }
    setLoading(false);
  };

  const subscribeToPayments = () => {
    const channel = supabase
      .channel('payments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
        },
        () => {
          fetchPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const updatePaymentStatus = async (paymentId: string, newStatus: 'pending' | 'completed' | 'failed' | 'refunded') => {
    const { error } = await supabase
      .from('payments')
      .update({ status: newStatus })
      .eq('id', paymentId);

    if (error) {
      toast.error('Failed to update payment status');
      return;
    }

    // Send alert email
    const payment = payments.find(p => p.id === paymentId);
    if (payment) {
      await supabase.functions.invoke('send-transaction-alert', {
        body: {
          type: 'payment',
          status: newStatus,
          amount: payment.amount,
          customerName: payment.booking.client.full_name,
          customerEmail: payment.booking.client.email,
          transactionId: paymentId,
        },
      });
    }

    toast.success('Payment status updated');
    fetchPayments();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive',
      refunded: 'secondary',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  if (loading) {
    return <div className="text-center py-8">Loading transactions...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Monitor</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No transactions yet
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    {new Date(payment.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{payment.booking.client.full_name}</p>
                      <p className="text-sm text-muted-foreground">{payment.booking.client.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{payment.booking.service.name}</TableCell>
                  <TableCell>${payment.amount.toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updatePaymentStatus(payment.id, 'completed')}
                        disabled={payment.status === 'completed'}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updatePaymentStatus(payment.id, 'pending')}
                        disabled={payment.status === 'pending'}
                      >
                        <Clock className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updatePaymentStatus(payment.id, 'failed')}
                        disabled={payment.status === 'failed'}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TransactionMonitor;
