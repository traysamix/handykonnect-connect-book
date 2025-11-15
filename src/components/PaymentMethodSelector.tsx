import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Building2, Bitcoin, Copy, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PaymentForm from './PaymentForm';

type PaymentMethod = 'card' | 'bank' | 'bitcoin' | null;

interface PaymentMethodSelectorProps {
  bookingId: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const PaymentMethodSelector = ({ bookingId, amount, onSuccess, onCancel }: PaymentMethodSelectorProps) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
    });
  };

  // Bank account details - Replace with your actual bank details
  const bankDetails = {
    accountName: 'Handykonnect Services',
    accountNumber: '1234567890',
    routingNumber: '987654321',
    bankName: 'Your Bank Name',
    swiftCode: 'YOURBANKSWIFT',
  };

  // Bitcoin wallet address - Replace with your actual Bitcoin address
  const bitcoinAddress = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';

  if (selectedMethod === 'card') {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setSelectedMethod(null)} className="mb-4">
          ← Back to payment methods
        </Button>
        <PaymentForm
          bookingId={bookingId}
          amount={amount}
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      </div>
    );
  }

  if (selectedMethod === 'bank') {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setSelectedMethod(null)} className="mb-4">
          ← Back to payment methods
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Bank Transfer Details
            </CardTitle>
            <CardDescription>
              Transfer ${amount} to the account below. Your booking will be confirmed once payment is received.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Account Name</p>
                  <p className="font-semibold">{bankDetails.accountName}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(bankDetails.accountName, 'Account name')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Account Number</p>
                  <p className="font-semibold font-mono">{bankDetails.accountNumber}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(bankDetails.accountNumber, 'Account number')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Routing Number</p>
                  <p className="font-semibold font-mono">{bankDetails.routingNumber}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(bankDetails.routingNumber, 'Routing number')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bank Name</p>
                  <p className="font-semibold">{bankDetails.bankName}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(bankDetails.bankName, 'Bank name')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">SWIFT Code</p>
                  <p className="font-semibold font-mono">{bankDetails.swiftCode}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(bankDetails.swiftCode, 'SWIFT code')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="pt-3 border-t">
                <p className="text-sm text-muted-foreground">Amount to Transfer</p>
                <p className="text-2xl font-bold text-primary">${amount}</p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-semibold mb-1">Important Instructions:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                    <li>Include your booking reference in the transfer note</li>
                    <li>Your booking will be confirmed within 1-2 business days</li>
                    <li>You will receive an email confirmation once payment is verified</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button onClick={onSuccess} className="flex-1">
                I've Made the Transfer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedMethod === 'bitcoin') {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setSelectedMethod(null)} className="mb-4">
          ← Back to payment methods
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bitcoin className="h-5 w-5" />
              Bitcoin Payment
            </CardTitle>
            <CardDescription>
              Send ${amount} worth of Bitcoin to the address below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Bitcoin Address</p>
                <div className="flex items-center gap-2 bg-background p-3 rounded border break-all">
                  <code className="text-sm font-mono flex-1">{bitcoinAddress}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(bitcoinAddress, 'Bitcoin address')}
                    className="flex-shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="pt-3 border-t">
                <p className="text-sm text-muted-foreground">Amount (USD)</p>
                <p className="text-2xl font-bold text-primary">${amount}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Convert to BTC using current exchange rate
                </p>
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex gap-2">
                <CheckCircle2 className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-orange-900 dark:text-orange-100">
                  <p className="font-semibold mb-1">Important Instructions:</p>
                  <ul className="list-disc list-inside space-y-1 text-orange-800 dark:text-orange-200">
                    <li>Send the exact BTC equivalent of ${amount}</li>
                    <li>Network confirmations may take 10-60 minutes</li>
                    <li>Your booking will be confirmed after 3 network confirmations</li>
                    <li>You will receive an email once payment is verified</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button onClick={onSuccess} className="flex-1">
                I've Sent Bitcoin
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Payment method selection screen
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Choose Payment Method</h2>
        <p className="text-muted-foreground">Select how you'd like to pay ${amount}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="cursor-pointer hover:border-primary transition-all hover:shadow-lg"
          onClick={() => setSelectedMethod('card')}
        >
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-3">
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Card Payment</CardTitle>
            <CardDescription>Pay instantly with credit or debit card</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="default">
              Pay with Card
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Secure payment via Stripe
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary transition-all hover:shadow-lg"
          onClick={() => setSelectedMethod('bank')}
        >
          <CardHeader className="text-center">
            <div className="mx-auto bg-blue-500/10 w-16 h-16 rounded-full flex items-center justify-center mb-3">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle>Bank Transfer</CardTitle>
            <CardDescription>Direct bank transfer payment</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              View Bank Details
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              1-2 business days processing
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary transition-all hover:shadow-lg"
          onClick={() => setSelectedMethod('bitcoin')}
        >
          <CardHeader className="text-center">
            <div className="mx-auto bg-orange-500/10 w-16 h-16 rounded-full flex items-center justify-center mb-3">
              <Bitcoin className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle>Bitcoin</CardTitle>
            <CardDescription>Pay with cryptocurrency</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              Pay with Bitcoin
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Blockchain confirmation required
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center pt-4">
        <Button variant="ghost" onClick={onCancel}>
          Cancel Payment
        </Button>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
