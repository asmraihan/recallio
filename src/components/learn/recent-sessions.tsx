"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Session {
  id: string;
  type: string;
  direction: string;
  startedAt: string;
  completedAt: string | null;
  totalWords: number;
  correctAnswers: number;
  accuracy: number;
  duration: number | null;
}

export function RecentSessions() {
  const router = useRouter();
  const { data: sessions, isLoading } = useQuery<Session[]>({
    queryKey: ["recent-sessions"],
    queryFn: async () => {
      const response = await fetch("/api/learn/sessions/recent");
      if (!response.ok) throw new Error("Failed to fetch recent sessions");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!sessions?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            No learning sessions yet. Start your first session to begin learning!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[50vh]">
      <div className="space-y-4">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center justify-between rounded-lg border p-4 cursor-pointer hover:bg-accent/40 transition"
            onClick={() => {
              if (!session.completedAt) {
                router.push(`/dashboard/learn/session/${session.id}`);
              }
            }}
          >
            <div className="space-y-1">
              <p className="font-medium">
                {session.type.charAt(0).toUpperCase() + session.type.slice(1)} Session
              </p>
              <p className="text-sm text-muted-foreground">
                {session.direction.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })}
              </p>
            </div>
            <div className="text-right">
              {session.completedAt ? (
                <>
                  <p className="font-medium">
                    {session.correctAnswers}/{session.totalWords} correct
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {Math.round(session.accuracy * 100)}% accuracy
                  </p>
                  {session.duration && (
                    <p className="text-sm text-muted-foreground">
                      {Math.round(session.duration / 60)} minutes
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-primary font-semibold">In progress (click to continue)</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}