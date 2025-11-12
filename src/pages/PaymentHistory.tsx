import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, DollarSign, Calendar } from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  stripe_payment_id: string | null;
  booking: {
    service: {
      name: string;
    };
    scheduled_date: string;
    address: string;
  };
}

const PaymentHistory = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
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
      fetchPayments();
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

  const fetchPayments = async () => {
    const { data } = await supabase
      .from('payments')
      .select(`
        *,
        booking:bookings(
          service:services(name),
          scheduled_date,
          address
        )
      `)
      .order('created_at', { ascending: false });

    if (data) {
      setPayments(data as any);
    }
  };

  const downloadReceipt = (payment: Payment) => {
    const receiptText = `
HANDYKONNECT - PAYMENT RECEIPT
================================

Receipt ID: ${payment.id}
Payment Date: ${new Date(payment.created_at).toLocaleString()}
Status: ${payment.status.toUpperCase()}

SERVICE DETAILS:
Service: ${payment.booking.service.name}
Scheduled Date: ${new Date(payment.booking.scheduled_date).toLocaleString()}
Address: ${payment.booking.address}

PAYMENT INFORMATION:
Amount Paid: $${payment.amount.toFixed(2)}
${payment.stripe_payment_id ? `Stripe Payment ID: ${payment.stripe_payment_id}` : ''}

Thank you for choosing Handykonnect!
    `;

    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${payment.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      case 'refunded':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTotalPaid = () => {
    return payments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
  };

  if (loading || !profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Payment History</h1>
          <p className="text-muted-foreground">View all your transactions and download receipts</p>
        </div>

        {/* Summary Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  <p className="text-2xl font-bold">${getTotalPaid().toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{payments.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Download className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">
                    {payments.filter((p) => p.status === 'completed').length}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment List */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>All your payment transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No payment history yet
              </p>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <Card key={payment.id} className="bg-gradient-card">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{payment.booking.service.name}</h3>
                            <Badge className={getStatusColor(payment.status)}>
                              {payment.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Service Date: {new Date(payment.booking.scheduled_date).toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Payment Date: {new Date(payment.created_at).toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Address: {payment.booking.address}
                          </p>
                          <p className="text-lg font-bold text-primary mt-2">
                            ${payment.amount.toFixed(2)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadReceipt(payment)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Receipt
                        </Button>
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
  );
};

export default PaymentHistory;
