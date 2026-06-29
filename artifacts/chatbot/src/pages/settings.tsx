import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useGetSettings, useUpdateSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Save } from "lucide-react";
import { useAuth } from "@clerk/react";

export default function Settings() {
  const { isSignedIn } = useAuth();
  const { data: settings, isLoading } = useGetSettings({
    query: {
      queryKey: getGetSettingsQueryKey(),
      enabled: !!isSignedIn,
    },
  });
  const updateSettings = useUpdateSettings();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [model, setModel] = useState("gpt-4");
  const [systemPrompt, setSystemPrompt] = useState("");

  useEffect(() => {
    if (settings) {
      setTheme(settings.theme as any);
      setModel(settings.model);
      setSystemPrompt(settings.systemPrompt || "");
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate(
      { data: { theme, model, systemPrompt } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
          toast({
            title: "Settings saved",
            description: "Your preferences have been updated.",
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to save settings.",
            variant: "destructive",
          });
        }
      }
    );
  };

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto px-4 py-8 md:px-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-2">Manage your account preferences and AI behavior.</p>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-[200px] w-full" />
              <Skeleton className="h-[200px] w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize how Nexus AI looks on your device.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Label>Theme</Label>
                    <RadioGroup 
                      value={theme} 
                      onValueChange={(v: any) => setTheme(v)}
                      className="grid grid-cols-3 gap-4"
                    >
                      <div>
                        <RadioGroupItem value="light" id="theme-light" className="peer sr-only" />
                        <Label
                          htmlFor="theme-light"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <div className="space-y-2 w-full mb-2">
                            <div className="h-2 w-[80%] rounded-lg bg-zinc-200" />
                            <div className="h-2 w-[60%] rounded-lg bg-zinc-200" />
                          </div>
                          Light
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="dark" id="theme-dark" className="peer sr-only" />
                        <Label
                          htmlFor="theme-dark"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-zinc-950 p-4 hover:bg-zinc-900 hover:text-zinc-50 peer-data-[state=checked]:border-primary text-zinc-400"
                        >
                          <div className="space-y-2 w-full mb-2">
                            <div className="h-2 w-[80%] rounded-lg bg-zinc-800" />
                            <div className="h-2 w-[60%] rounded-lg bg-zinc-800" />
                          </div>
                          Dark
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="system" id="theme-system" className="peer sr-only" />
                        <Label
                          htmlFor="theme-system"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <div className="space-y-2 w-full mb-2 flex">
                            <div className="flex-1 p-1 bg-zinc-200 rounded-l-lg border-r border-zinc-300">
                               <div className="h-1 w-[80%] rounded-lg bg-zinc-300 mb-1" />
                            </div>
                            <div className="flex-1 p-1 bg-zinc-900 rounded-r-lg">
                               <div className="h-1 w-[80%] rounded-lg bg-zinc-800 mb-1" />
                            </div>
                          </div>
                          System
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI Preferences</CardTitle>
                  <CardDescription>Configure how the AI responds to your messages.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>Model</Label>
                    <RadioGroup 
                      value={model} 
                      onValueChange={setModel}
                      className="grid gap-2"
                    >
                      <div className="flex items-center space-x-2 border rounded-md p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                        <RadioGroupItem value="gpt-4" id="model-gpt4" />
                        <Label htmlFor="model-gpt4" className="flex-1 cursor-pointer">
                          <div className="font-semibold">Nexus Pro (Recommended)</div>
                          <div className="text-xs text-muted-foreground font-normal">Most capable model, best for complex reasoning and coding.</div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 border rounded-md p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                        <RadioGroupItem value="gpt-3.5-turbo" id="model-gpt35" />
                        <Label htmlFor="model-gpt35" className="flex-1 cursor-pointer">
                          <div className="font-semibold">Nexus Fast</div>
                          <div className="text-xs text-muted-foreground font-normal">Faster responses for simpler tasks.</div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="systemPrompt">Custom Instructions</Label>
                    <Textarea 
                      id="systemPrompt" 
                      placeholder="e.g. Always respond in markdown. Be concise. Never use emojis."
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      className="h-32"
                    />
                    <p className="text-xs text-muted-foreground">
                      These instructions will be appended to the system prompt for every new conversation.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={updateSettings.isPending}>
                  {updateSettings.isPending ? "Saving..." : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
