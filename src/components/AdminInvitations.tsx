import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';

interface Invitation {
  id: string;
  invited_email: string;
  status: string;
  created_at: string;
  expires_at: string;
}

const AdminInvitations = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    const { data } = await supabase
      .from('admin_invitations')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setInvitations(data);
    }
  };

  const sendInvitation = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('You must be logged in');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('admin_invitations').insert({
      invited_email: email.trim(),
      invited_by: user.id,
    });

    if (error) {
      toast.error('Failed to send invitation');
      setLoading(false);
      return;
    }

    // Check if user already exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.trim())
      .single();

    if (profile) {
      // Add admin role to existing user
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: profile.id,
          role: 'admin',
        });

      if (!roleError) {
        toast.success('Admin access granted to existing user');
      }
    } else {
      toast.success('Invitation sent! User will get admin access upon signup.');
    }

    setEmail('');
    setLoading(false);
    fetchInvitations();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Admin Users</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendInvitation()}
          />
          <Button onClick={sendInvitation} disabled={loading}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent Date</TableHead>
              <TableHead>Expires</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No invitations sent yet
                </TableCell>
              </TableRow>
            ) : (
              invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell>{invitation.invited_email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={invitation.status === 'accepted' ? 'default' : 'secondary'}
                    >
                      {invitation.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(invitation.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(invitation.expires_at).toLocaleDateString()}
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

export default AdminInvitations;
