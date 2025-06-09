"use client";

import { useState } from "react";
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

// Define the form schema
const formSchema = z.object({
  pattern: z.enum(["german-bangla", "german-english", "german-bangla-english"]),
  words: z.string().min(1, "Please enter some words"),
  section: z.coerce.number().min(1, "Section must be at least 1"),
});

type FormValues = z.infer<typeof formSchema>;

interface ParsedWord {
  germanWord: string;
  banglaTranslation: string | null;
  englishTranslation: string | null;
  section: number;
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pattern: "german-bangla-english",
      words: "",
      section: 1,
    },
  });

  const pattern = form.watch("pattern");

  const parseWords = (text: string, currentPattern: FormValues["pattern"]) => {
    setParseError(null);
    
    // Split into lines and clean them
    const lines = text
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const words: ParsedWord[] = [];
    const errors: string[] = [];

    lines.forEach((line, index) => {
      // Only accept format: word-word with no spaces
      const parts = line.split("-");
      
      const expectedParts = currentPattern === "german-bangla-english" ? 3 : 2;
      
      if (parts.length !== expectedParts) {
        errors.push(
          `Line ${index + 1}: Invalid format.\n` +
          `Expected: "${patternInstructions[currentPattern].example}"\n` +
          `Got: "${line}"`
        );
        return;
      }

      // Validate that we have non-empty parts
      if (parts.some(part => !part.trim())) {
        errors.push(
          `Line ${index + 1}: All parts must be non-empty.\n` +
          `Got: "${line}"`
        );
        return;
      }

      // Check for any spaces in the parts
      if (parts.some(part => part.includes(" "))) {
        errors.push(
          `Line ${index + 1}: No spaces allowed between hyphens.\n` +
          `Expected: "${patternInstructions[currentPattern].example}"\n` +
          `Got: "${line}"`
        );
        return;
      }

      const [german, second, third] = parts;
      
      words.push({
        germanWord: german.trim(),
        banglaTranslation: currentPattern === "german-english" ? null : second.trim(),
        englishTranslation: currentPattern === "german-bangla" ? null : 
          currentPattern === "german-english" ? second.trim() : third.trim(),
        section: form.getValues("section"),
      });
    });

    if (errors.length > 0) {
      setParseError(errors.join("\n"));
      setParsedWords([]);
    } else {
      setParsedWords(words);
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (parsedWords.length === 0) {
      parseWords(data.words, data.pattern);
      if (parsedWords.length === 0) {
        return;
      }
    }

    try {
      setIsAdding(true);
      const response = await fetch("/api/words/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words: parsedWords }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add words");
      }

      toast.success(data.message || `Added ${parsedWords.length} words to section ${data.section}`);
      form.reset();
      setParsedWords([]);
      setParseError(null);
      
      // Refresh the word list
      await queryClient.invalidateQueries({ queryKey: ["words"] });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add words. Please try again.");
    } finally {
      setIsAdding(false);
    }
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
              <Label htmlFor="section">Section Number</Label>
              <Input
                id="section"
                type="number"
                min={1}
                {...form.register("section", { 
                  valueAsNumber: true,
                  onChange: (e) => {
                    const value = parseInt(e.target.value);
                    if (value < 1) e.target.value = "1";
                    form.setValue("section", value);
                  }
                })}
              />
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {patternInstructions[pattern].description}
              <br />
              Example: {patternInstructions[pattern].example}
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