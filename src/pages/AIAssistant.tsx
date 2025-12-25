import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRBAC } from '@/hooks/useRBAC';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Send, Loader2, Bot, User, CheckCircle2, XCircle, Info } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: string;
  success?: boolean;
  timestamp: Date;
}

interface AIResponse {
  action: string;
  data?: {
    name?: string;
    description?: string;
    role_name?: string;
    permission_name?: string;
  };
  message: string;
  error?: string;
}

export default function AIAssistant() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    roles,
    permissions,
    createPermission,
    createRole,
    assignPermissionToRole,
    removePermissionFromRole,
  } = useRBAC();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your RBAC AI Assistant. I can help you manage roles and permissions using natural language. Try commands like:\n\n• \"Create a permission called can_publish_content\"\n• \"Create a new role named Marketing Manager\"\n• \"Give the Content Editor role the permission to edit articles\"\n• \"Remove delete permission from the Viewer role\"",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return null;
  }

  const executeAction = async (response: AIResponse): Promise<{ success: boolean; message: string }> => {
    const { action, data } = response;

    try {
      switch (action) {
        case 'create_permission': {
          if (!data?.name) {
            return { success: false, message: 'Permission name is required' };
          }
          const result = await createPermission(data.name, data.description);
          return result
            ? { success: true, message: `Permission "${data.name}" created successfully!` }
            : { success: false, message: 'Failed to create permission. It may already exist.' };
        }

        case 'create_role': {
          if (!data?.name) {
            return { success: false, message: 'Role name is required' };
          }
          const result = await createRole(data.name, data.description);
          return result
            ? { success: true, message: `Role "${data.name}" created successfully!` }
            : { success: false, message: 'Failed to create role. It may already exist.' };
        }

        case 'assign_permission': {
          if (!data?.role_name || !data?.permission_name) {
            return { success: false, message: 'Both role name and permission name are required' };
          }
          const role = roles.find(r => r.name.toLowerCase() === data.role_name.toLowerCase());
          const permission = permissions.find(p => p.name.toLowerCase() === data.permission_name.toLowerCase());
          
          if (!role) {
            return { success: false, message: `Role "${data.role_name}" not found` };
          }
          if (!permission) {
            return { success: false, message: `Permission "${data.permission_name}" not found` };
          }
          
          const result = await assignPermissionToRole(role.id, permission.id);
          return result
            ? { success: true, message: `Permission "${permission.name}" assigned to "${role.name}" successfully!` }
            : { success: false, message: 'Failed to assign permission. It may already be assigned.' };
        }

        case 'remove_permission': {
          if (!data?.role_name || !data?.permission_name) {
            return { success: false, message: 'Both role name and permission name are required' };
          }
          const role = roles.find(r => r.name.toLowerCase() === data.role_name.toLowerCase());
          const permission = permissions.find(p => p.name.toLowerCase() === data.permission_name.toLowerCase());
          
          if (!role) {
            return { success: false, message: `Role "${data.role_name}" not found` };
          }
          if (!permission) {
            return { success: false, message: `Permission "${data.permission_name}" not found` };
          }
          
          const result = await removePermissionFromRole(role.id, permission.id);
          return result
            ? { success: true, message: `Permission "${permission.name}" removed from "${role.name}" successfully!` }
            : { success: false, message: 'Failed to remove permission.' };
        }

        case 'info':
          return { success: true, message: response.message };

        default:
          return { success: true, message: response.message };
      }
    } catch (error) {
      console.error('Error executing action:', error);
      return { success: false, message: 'An unexpected error occurred' };
    }
  };

  const handleSend = async () => {
    if (!input.trim() || processing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('rbac-ai', {
        body: { message: input.trim() },
      });

      if (error) throw error;

      const aiResponse = data as AIResponse;

      if (aiResponse.error) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: aiResponse.error || 'An error occurred',
            success: false,
            timestamp: new Date(),
          },
        ]);
        return;
      }

      // Execute the action
      const result = await executeAction(aiResponse);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: result.message,
          action: aiResponse.action,
          success: result.success,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('AI error:', error);
      toast({
        title: 'AI Error',
        description: 'Failed to process your request. Please try again.',
        variant: 'destructive',
      });
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your request. Please try again.',
          success: false,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getActionBadge = (action?: string, success?: boolean) => {
    if (!action || action === 'info') return null;
    
    const actionLabels: Record<string, string> = {
      create_permission: 'Create Permission',
      create_role: 'Create Role',
      assign_permission: 'Assign Permission',
      remove_permission: 'Remove Permission',
      error: 'Error',
    };

    return (
      <Badge
        variant={success ? 'default' : 'destructive'}
        className="gap-1"
      >
        {success ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
        {actionLabels[action] || action}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="AI Assistant"
        description="Configure roles and permissions using natural language commands"
      />

      <Card className="animate-slide-up">
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg gradient-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">Natural Language Configuration</CardTitle>
              <CardDescription>
                Describe what you want to do and I'll help you configure your RBAC settings
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Messages */}
          <ScrollArea className="h-[500px] p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={`flex-1 max-w-[80%] ${
                      message.role === 'user' ? 'text-right' : ''
                    }`}
                  >
                    <div
                      className={`inline-block p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === 'assistant' && message.action && (
                      <div className="mt-2">
                        {getActionBadge(message.action, message.success)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {processing && (
                <div className="flex gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Type a command... (e.g., Create a permission called can_view_reports)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={processing}
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={!input.trim() || processing}>
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Press Enter to send, or click the send button
            </p>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
