import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
  sender?: {
    full_name: string;
    role: string;
  };
}

interface SupportChatProps {
  conversationId?: string;
}

const SupportChat = ({ conversationId }: SupportChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState(conversationId || '');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentConversationId && user) {
      // Create a new conversation ID if none exists
      setCurrentConversationId(crypto.randomUUID());
    }
  }, [user]);

  useEffect(() => {
    if (currentConversationId) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [currentConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(full_name, role)
      `)
      .eq('conversation_id', currentConversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    if (data) {
      setMessages(data as Message[]);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages:${currentConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${currentConversationId}`,
        },
        (payload) => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: currentConversationId,
        sender_id: user.id,
        content: newMessage.trim(),
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
      return;
    }

    setNewMessage('');
  };

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Support Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Start a conversation with our support team
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender_id === user?.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.sender && message.sender_id !== user?.id && (
                      <div className="text-xs font-semibold mb-1 opacity-70">
                        {message.sender.full_name} {message.sender.role === 'admin' ? '(Support)' : ''}
                      </div>
                    )}
                    <p className="text-sm">{message.content}</p>
                    <div className="text-xs opacity-70 mt-1">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
        <form onSubmit={sendMessage} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SupportChat;
