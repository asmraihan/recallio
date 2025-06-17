"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Copy } from "lucide-react";

// Define the form schema
const formSchema = z.object({
  pattern: z.enum(["german-bangla", "german-english", "german-bangla-english"]),
  words: z.string().min(1, "Please enter some words"),
  section: z.string().min(1, "Section is required"),
});

interface FormValues {
  pattern: "german-bangla" | "german-english" | "german-bangla-english";
  words: string;
  section: string;
}

interface ParsedWord {
  germanWord: string;
  banglaTranslation: string | null;
  englishTranslation: string | null;
  section: string;
}

const patternInstructions = {
  "german-bangla": {
    example: "Haus-বাড়ি",
    description: "German word followed by Bangla translation",
  },
  "german-english": {
    example: "Haus-house",
    description: "German word followed by English translation",
  },
  "german-bangla-english": {
    example: "Haus-বাড়ি-house",
    description: "German word followed by Bangla and English translations",
  },
};

export function BatchAddForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedWords, setParsedWords] = useState<ParsedWord[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [section, setSection] = useState("Sec 1");
  const promptRef = useRef<HTMLSpanElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pattern: "german-bangla",
      words: "",
      section: "Sec 1",
    },
  });

  const pattern = form.watch("pattern");

  const parseWords = useCallback((text: string, currentPattern: FormValues["pattern"]) => {
    if (!text.trim()) {
      setParsedWords([]);
      setParseError(null);
      return;
    }

    try {
      const lines = text.trim().split("\n");
      const words = lines.map((line) => {
        const parts = line.split(/[,\t]/).map((part) => part.trim());
        if (parts.length < 2) {
          throw new Error(`Invalid format in line: ${line}`);
        }

        const [first, second, third] = parts;
        return ({
          germanWord: first.trim(),
          banglaTranslation: currentPattern === "german-english" ? null :
            currentPattern === "german-bangla" ? second.trim() : second.trim(),
          englishTranslation: currentPattern === "german-bangla" ? null :
            currentPattern === "german-english" ? second.trim() : third.trim(),
          section: form.getValues("section"),
        });
      });

      setParsedWords(words);
      setParseError(null);
    } catch (error) {
      setParsedWords([]);
      setParseError(error instanceof Error ? error.message : "Failed to parse words");
    }
  }, [form]);

  const onSubmit = async (data: FormValues) => {
    try {
      setIsAdding(true);
      const response = await fetch("/api/words/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          words: parsedWords,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add words");
      }

      const result = await response.json();
      toast.success(result.message || `Added ${parsedWords.length} words to section ${data.section}`);
      form.reset({
        pattern: "german-bangla",
        words: "",
        section: "Sec 1",
      });
      setSection("Sec 1");
      setParsedWords([]);
      setParseError(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add words");
    } finally {
      setIsAdding(false);
    }
  };

  const handleCopyPrompt = () => {
    if (promptRef.current) {
      const text = promptRef.current.innerText;
      navigator.clipboard.writeText(text);
      toast.success("Prompt copied to clipboard!");
    }
  };

  const handleSectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSection(value);
    form.setValue("section", value);
    // Re-parse words to update preview
    parseWords(form.getValues("words"), pattern);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch Add Words</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pattern">Input Pattern</Label>
              <Select
                value={pattern}
                onValueChange={(value) => {
                  form.setValue("pattern", value as FormValues["pattern"]);
                  if (form.getValues("words")) {
                    parseWords(form.getValues("words"), value as FormValues["pattern"]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pattern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="german-bangla">German - Bangla</SelectItem>
                  <SelectItem value="german-english">German - English</SelectItem>
                  <SelectItem value="german-bangla-english">German - Bangla - English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Input
                id="section"
                placeholder="Section (e.g., Sec 1)"
                value={section}
                onChange={handleSectionChange}
              />
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="relative">
              {patternInstructions[pattern].description}
              <br />
              <br />
              Example: {patternInstructions[pattern].example}
              <br />
              <br />
              Prompt: {" "}
              <span>"</span>
              <span ref={promptRef} className="">
              Give me translation list of German words followed by Bangla and English translations in this exact format: German-বাংলা-English. Use only two hyphens per line — one between German and Bangla, and one between Bangla and English. Never use extra hyphens, dashes, or slashes inside any translation. Use simple, clean Bangla and English words. Example: Haus-বাড়ি-house.If a word refers to multiple meanings (like 'Eltern'), choose one clear equivalent. For nouns, always include the definite article (der, die, or das) with the word.
              </span>
              <span>"</span>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="absolute top-0 right-0 p-1 bg-white rounded hover:bg-gray-100 border border-gray-200"
                aria-label="Copy prompt"
                tabIndex={0}
              >
                <Copy className="h-4 w-4 text-gray-500" />
              </button>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="words">Words</Label>
            <Textarea
              id="words"
              placeholder={`Enter words in format: ${patternInstructions[pattern].example}\nExample:\n${patternInstructions[pattern].example}`}
              className="font-mono"
              rows={6}
              {...form.register("words", {
                onChange: (e) => parseWords(e.target.value, pattern),
              })}
            />
            <p className="text-sm text-muted-foreground">
              Enter each word on a new line. Use hyphens (-) to separate parts. No spaces allowed.
            </p>
          </div>

          {parseError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="whitespace-pre-wrap">
                {parseError}
              </AlertDescription>
            </Alert>
          )}

          {parsedWords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-4 gap-4 p-4 font-medium border-b">
                    <div>German</div>
                    <div>Bangla</div>
                    <div>English</div>
                    <div>Section</div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {parsedWords.map((word, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-4 gap-4 p-4 border-b last:border-0"
                      >
                        <div>{word.germanWord}</div>
                        <div>{word.banglaTranslation || "-"}</div>
                        <div>{word.englishTranslation || "-"}</div>
                        <div>{word.section}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Button type="submit" disabled={isAdding || parsedWords.length === 0}>
            {isAdding ? "Adding..." : `Add ${parsedWords.length} Words`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}