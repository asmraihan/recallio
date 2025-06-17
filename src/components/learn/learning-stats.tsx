"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface LearningStats {
  totalWords: number;
  masteredWords: number;
  learningWords: number;
  dueWords: number;
  averageAccuracy: number;
  learningStreak: number;
  sectionProgress: {
    section: string;
    total: number;
    mastered: number;
  }[];
}

export function LearningStats() {
  const { data: stats, isLoading } = useQuery<LearningStats>({
    queryKey: ["learning-stats"],
    queryFn: async () => {
      const response = await fetch("/api/learn/stats");
      if (!response.ok) throw new Error("Failed to fetch learning stats");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <Loader2 className="h-4 w-4 animate-spin" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-2 w-full animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const masteryPercentage = Math.round((stats.masteredWords / stats.totalWords) * 100) || 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Words Mastered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.masteredWords}</div>
            <Progress value={masteryPercentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {masteryPercentage}% of total words
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due for Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dueWords}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Words ready for review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.learningStreak}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Days of consistent learning
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(stats.averageAccuracy * 100)}%
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Across all sessions
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Section Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.sectionProgress.map((section) => {
              // Use the correct property names from the frontend type
              const total = section.total;
              const mastered = section.mastered;
              const progress = Math.round((mastered / total) * 100) || 0;
              return (
                <div key={section.section} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Section {section.section}</p>
                    <p className="text-sm text-muted-foreground">
                      {mastered}/{total} words mastered
                    </p>
                  </div>
                  <Progress value={progress} />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}