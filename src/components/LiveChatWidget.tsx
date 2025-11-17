import { useState, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender: {
    full_name: string;
  };
}

const LiveChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const convId = `support_${user.id}`;
      setConversationId(convId);
      fetchMessages(convId);
      subscribeToMessages(convId);
    }
  }, [user]);

  const fetchMessages = async (convId: string) => {
    const { data } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(full_name)
      `)
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data as Message[]);
    }
  };

  const subscribeToMessages = (convId: string) => {
    const channel = supabase
      .channel(`chat-${convId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${convId}`,
        },
        () => {
          fetchMessages(convId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      content: newMessage.trim(),
      sender_id: user.id,
    });

    if (error) {
      toast.error('Failed to send message');
      return;
    }

    setNewMessage('');
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-xl z-50 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-lg">Live Support</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-4 gap-4">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm">
                    Start a conversation with our support team
                  </p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender_id === user.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.sender_id === user.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-xs font-semibold mb-1">
                          {msg.sender.full_name}
                        </p>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button onClick={handleSendMessage} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default LiveChatWidget;
