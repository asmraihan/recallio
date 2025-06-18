"use client";

import { useState, useEffect, useCallback } from "react";
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
import { useRouter, useSearchParams, usePathname } from "next/navigation";

// Match the database schema
interface Word {
  id: string;
  germanWord: string;
  englishTranslation: string | null;
  banglaTranslation: string | null;
  exampleSentence: string | null;
  notes: string | null;
  section: string;
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
  section: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function WordsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [sections, setSections] = useState<string[]>([]);
  const [sectionsLoaded, setSectionsLoaded] = useState(false);

  // Get values from URL or defaults
  const search = searchParams.get("search") || "";
  const section = searchParams.get("section") || "";

  // Create a memoized function for updating URL params
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  // Update URL when filters change
  const updateFilters = useCallback((name: string, value: string) => {
    const queryString = createQueryString(name, value);
    router.push(`${pathname}?${queryString}`, { scroll: false });
  }, [pathname, router, createQueryString]);

  // Fetch sections on mount
  useEffect(() => {
    fetch("/api/words/sections")
      .then(res => res.json())
      .then((data: { sections: string[] }) => {
        setSections(data.sections);
        if (!section && data.sections.length > 0) {
          updateFilters("section", data.sections[0]);
        }
        setSectionsLoaded(true);
      });
  }, [section, updateFilters]);

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
    enabled: sectionsLoaded,
    retry: 1,
  });

  const filteredWords = words.filter((word) => {
    if (!search) return true;
    const matchesSearch =
      word.germanWord.toLowerCase().includes(search.toLowerCase()) ||
      (word.englishTranslation?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (word.banglaTranslation?.toLowerCase().includes(search.toLowerCase()) ?? false);
    return matchesSearch;
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
            onChange={(e) => updateFilters("search", e.target.value)}
            className="max-w-sm"
          />
          <Select
            value={section}
            onValueChange={(value) => updateFilters("section", value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {sections.map((sectionValue) => (
                <SelectItem key={sectionValue} value={sectionValue}>
                 Section {sectionValue}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* <div className="flex items-center gap-2">
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
        </div> */}
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