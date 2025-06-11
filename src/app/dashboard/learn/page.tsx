"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Loader2, BookOpen, GraduationCap, RefreshCw, AlertCircle } from "lucide-react";
import { StartSessionDialog } from "@/components/learn/start-session-dialog";
import { RecentSessions } from "@/components/learn/recent-sessions";
import { LearningStats } from "@/components/learn/learning-stats";

export default function LearnPage() {
  const [activeTab, setActiveTab] = useState("overview");


  // Fetch learning progress stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["learning-stats"],
    queryFn: async () => {
      const response = await fetch("/api/learn/stats");
      if (!response.ok) throw new Error("Failed to fetch learning stats");
      return response.json();
    },
  });

  // Fetch words due for review
  const { data: dueWords, isLoading: isLoadingDue } = useQuery({
    queryKey: ["due-words"],
    queryFn: async () => {
      const response = await fetch("/api/learn/due-words");
      if (!response.ok) throw new Error("Failed to fetch due words");
      return response.json();
    },
  });


  if (isLoadingStats || isLoadingDue) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learn</h1>
          <p className="text-muted-foreground">
            Master your German vocabulary with our spaced repetition system
          </p>
        </div>
        <StartSessionDialog />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Words Mastered</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.masteredWords || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Out of {stats?.totalWords || 0} words
                </p>
                <Progress 
                  value={(stats?.masteredWords / stats?.totalWords) * 100 || 0} 
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Due for Review</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dueWords?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Words ready for review
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Learning Streak</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.currentStreak || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Days of consistent learning
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.accuracy ? `${Math.round(stats.accuracy * 100)}%` : "0%"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Overall answer accuracy
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Start</CardTitle>
                <CardDescription>
                  Start a new learning session
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Button asChild variant="outline" className="justify-start">
                  <StartSessionDialog mode="review">
                    <span>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Review Due Words
                    </span>
                  </StartSessionDialog>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <StartSessionDialog mode="new">
                    <span>
                      <BookOpen className="mr-2 h-4 w-4" />
                      Learn New Words
                    </span>
                  </StartSessionDialog>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <StartSessionDialog mode="mistakes">
                    <span>
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Practice Mistakes
                    </span>
                  </StartSessionDialog>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
                <CardDescription>
                  Your latest learning activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentSessions />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="progress">
          <LearningStats />
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Learning Sessions</CardTitle>
              <CardDescription>
                View and manage your learning sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentSessions  />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs> 
    </div>
  );
} 