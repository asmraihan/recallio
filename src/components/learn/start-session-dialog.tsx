"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MultiSelect } from "@/components/multi-select";

type SessionMode = "review" | "new" | "mistakes" | "custom" | "important" | "randomized";

interface StartSessionDialogProps {
  children?: React.ReactNode;
  mode?: SessionMode;
}

export function StartSessionDialog({ children, mode = "new" }: StartSessionDialogProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [sessionType, setSessionType] = useState<SessionMode>(mode);
  const [direction, setDirection] = useState("german_to_english");
  // MultiSelect returns string[]; store as string[] in state
  const [section, setSection] = useState<string[]>([]);
  const [isStarting, setIsStarting] = useState(false);

  // Fetch available sections
  const { data: sectionsData, isLoading: isLoadingSections } = useQuery({
    queryKey: ["sections"],
    queryFn: async () => {
      const response = await fetch("/api/words/sections");
      if (!response.ok) throw new Error("Failed to fetch sections");
      const data = await response.json();
      return data.sections;
    },
  });
  console.log("Available sections:", sectionsData);
  const handleStartSession = async () => {
    if (!session?.user?.id) {
      toast.error("Please sign in to start a learning session");
      return;
    }

    setIsStarting(true);
    try {
      let body: any = {
        type: sessionType,
        direction,
        sections: section.map(Number),
      };
      if (sessionType === "important") {
        body = { type: "important", direction };
      }
      const response = await fetch("/api/learn/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorMsg = "Failed to start learning session";
        try {
          const errorData = await response.json();
          if (errorData?.error) errorMsg = errorData.error;
        } catch {}
        throw new Error(errorMsg);
      }

      const data = await response.json();
      setOpen(false);
      router.push(`/dashboard/learn/session/${data.sessionId}`);
    } catch (error) {
      console.error("Error starting session:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start learning session");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || <Button className="cursor-pointer">Start Learning</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Learning Session</DialogTitle>
          <DialogDescription>
            Choose your learning preferences to start a new session
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="session-type">Session Type</Label>
            <Select
              value={sessionType}
              onValueChange={(value: SessionMode) => setSessionType(value)}
            >
              <SelectTrigger id="session-type">
                <SelectValue placeholder="Select session type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Learn New Words</SelectItem>
                  <SelectItem value="randomized">Randomized Session</SelectItem>
                <SelectItem value="mistakes">Practice Mistakes</SelectItem>
                <SelectItem value="review">Review Due Words</SelectItem>
                <SelectItem value="important">Important Words</SelectItem>
                <SelectItem value="custom">Custom Session</SelectItem>
              
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="direction">Learning Direction</Label>
            <Select
              value={direction}
              onValueChange={setDirection}
            >
              <SelectTrigger id="direction">
                <SelectValue placeholder="Select learning direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="german_to_english">German → English</SelectItem>
                <SelectItem value="english_to_german">English → German</SelectItem>
                <SelectItem value="german_to_bangla">German → Bangla</SelectItem>
                <SelectItem value="bangla_to_german">Bangla → German</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="section">Sections</Label>
            <MultiSelect
              options={
                sectionsData?.map((sectionNum: number) => ({
                  value: sectionNum.toString(),
                  label: `Section ${sectionNum}`
                })) || []
              }
              onValueChange={(values) => setSection(values)}
              defaultValue={section}
              placeholder="Select sections"
              maxCount={5}
            // animation={1.5}
            />
            {isLoadingSections && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading sections...
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleStartSession}
            disabled={isStarting}
            className="cursor-pointer"
          >
            {isStarting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting Session...
              </>
            ) : (
              "Start Session"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}