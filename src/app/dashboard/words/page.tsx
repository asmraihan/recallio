"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WordList } from "@/components/words/word-list";
import { Loader2, Upload } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ExportDialog } from "@/components/words/export-import";

// Match the database schema
interface Word {
  id: string;
  germanWord: string;
  englishTranslation: string | null;
  banglaTranslation: string | null;
  exampleSentence: string | null;
  notes: string | null;
  section: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Type for the raw API response
interface WordResponse {
  id: string;
  germanWord: string;
  englishTranslation: string | null;
  banglaTranslation: string | null;
  exampleSentence: string | null;
  notes: string | null;
  section: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function WordsPage() {
  const [search, setSearch] = useState("");
  const [section, setSection] = useState<string>("all");
  const [sections, setSections] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<"date" | "word">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch sections on mount
  useEffect(() => {
    fetch("/api/words?sections=true")
      .then(res => res.json())
      .then((data: number[]) => {
        setSections(data);
        if (data.length > 0) setSection(data[0].toString());
      });
  }, []);

  // Fetch words for the selected section
  const { data: words = [], isLoading, error, refetch } = useQuery<Word[]>({
    queryKey: ["words", section],
    queryFn: async () => {
      let url = "/api/words";
      if (section && section !== "all") {
        url += `?section=${section}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch words");
      }
      const data = await response.json() as WordResponse[];
      return data.map((word) => ({
        ...word,
        createdAt: new Date(word.createdAt),
        updatedAt: new Date(word.updatedAt),
      }));
    },
    enabled: !!section,
    retry: 1,
  });

  const filteredWords = words.filter((word) => {
    const matchesSearch =
      word.germanWord.toLowerCase().includes(search.toLowerCase()) ||
      (word.englishTranslation?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (word.banglaTranslation?.toLowerCase().includes(search.toLowerCase()) ?? false);
    return matchesSearch;
  }).sort((a, b) => {
    if (sortBy === "date") {
      return sortOrder === "asc"
        ? a.createdAt.getTime() - b.createdAt.getTime()
        : b.createdAt.getTime() - a.createdAt.getTime();
    } else {
      return sortOrder === "asc"
        ? a.germanWord.localeCompare(b.germanWord)
        : b.germanWord.localeCompare(a.germanWord);
    }
  });

  if (error) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">Error</h2>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : "Failed to load words"}
          </p>
        </div>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Words</h1>
          <p className="text-muted-foreground mt-2">
            Manage your vocabulary collection
          </p>
        </div>
        <div className="flex gap-2">
          <ExportDialog />
          <Button asChild variant="outline">
            <Link href="/dashboard/words/add">
              <Upload className="mr-2 h-4 w-4" />
              Add Words
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <Input
            placeholder="Search words..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Select
            value={section}
            onValueChange={setSection}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {sections.map((sectionNum) => (
                <SelectItem key={sectionNum} value={sectionNum.toString()}>
                  Section {sectionNum}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={sortBy}
            onValueChange={(value: "date" | "word") => setSortBy(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date Added</SelectItem>
              <SelectItem value="word">German Word</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <div className="text-center">
            <h2 className="text-2xl font-bold">Loading...</h2>
            <p className="text-muted-foreground">Please wait while we fetch your words</p>
          </div>
        </div>
      ) : (
        <WordList words={filteredWords} />
      )}
    </div>
  );
}