import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import SupportChat from './SupportChat';
import { MessageSquare } from 'lucide-react';

interface Conversation {
  conversation_id: string;
  last_message: string;
  last_message_at: string;
  client_name: string;
  unread_count: number;
}

const AdminChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
    subscribeToNewMessages();
  }, []);

  const fetchConversations = async () => {
    // Get all unique conversations with their latest message
    const { data: messagesData } = await supabase
      .from('messages')
      .select(`
        conversation_id,
        content,
        created_at,
        sender:profiles!sender_id(full_name, role)
      `)
      .order('created_at', { ascending: false });

    if (messagesData) {
      // Group by conversation_id and get the latest message for each
      const conversationMap = new Map<string, Conversation>();
      
      messagesData.forEach((msg: any) => {
        if (!conversationMap.has(msg.conversation_id)) {
          conversationMap.set(msg.conversation_id, {
            conversation_id: msg.conversation_id,
            last_message: msg.content,
            last_message_at: msg.created_at,
            client_name: msg.sender.full_name,
            unread_count: 0,
          });
        }
      });

      setConversations(Array.from(conversationMap.values()));
    }
  };

  const subscribeToNewMessages = () => {
    const channel = supabase
      .channel('admin-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {conversations.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 px-4">
                No conversations yet
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {conversations.map((conv) => (
                  <div
                    key={conv.conversation_id}
                    onClick={() => setSelectedConversation(conv.conversation_id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation === conv.conversation_id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-semibold text-sm">{conv.client_name}</span>
                      {conv.unread_count > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {conv.unread_count}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs opacity-80 truncate">{conv.last_message}</p>
                    <span className="text-xs opacity-60">
                      {new Date(conv.last_message_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        {selectedConversation ? (
          <SupportChat conversationId={selectedConversation} />
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent>
              <p className="text-muted-foreground">Select a conversation to view messages</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminChat;
