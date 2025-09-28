"use client";

import { useState, useRef } from "react";
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
  pattern: z.literal("german-bangla-english"),  // Only one pattern now
  words: z.string().min(1, "Please enter some words"),
  section: z.string().min(1, "Section is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface ParsedWord {
  germanWord: string;
  translationTwo: string;
  translationOne: string;
  exampleSentence: string | null;
  section: string;
}

const patternInstructions = {
  "german-bangla-english": {
    example: "das Haus-বাড়ি-house-Das Haus ist groß",
    description: "German word with article, followed by Bangla translation, English translation, and optional example sentence",
  },
};

export function BatchAddForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedWords, setParsedWords] = useState<ParsedWord[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [section, setSection] = useState("");
  const promptRef = useRef<HTMLSpanElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pattern: "german-bangla-english",
      words: "",
      section: "", 
    },
  });

  const pattern = "german-bangla-english"; // Fixed pattern

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

        if (parts.length < 3 || parts.length > 4) {
        errors.push(
          `Line ${index + 1}: Invalid format.\n` +
          `Expected: "${patternInstructions["german-bangla-english"].example}"\n` +
          `Got: "${line}"`
        );
        return;
      }

      // Validate that required parts are non-empty
      if (!parts[0].trim() || !parts[1].trim() || !parts[2].trim()) {
        errors.push(
          `Line ${index + 1}: German word, Bangla translation, and English translation are required.\n` +
          `Got: "${line}"`
        );
        return;
      }

      const [german, bangla, english, example = null] = parts;

      words.push({
        germanWord: german.trim(),
        translationTwo: bangla.trim(),
        translationOne: english.trim(),
        exampleSentence: example ? example.trim() : null,
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
      // Prepare words with all fields including example sentence
      const wordsToSubmit = parsedWords.map((word, index) => ({
        germanWord: word.germanWord,
        translationTwo: word.translationTwo,
        translationOne: word.translationOne,
        exampleSentence: word.exampleSentence,
        section: word.section
      }));

      const response = await fetch("/api/words/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words: wordsToSubmit }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add words");
      }

      toast.success(data.message || `Added ${parsedWords.length} words to section ${data.section}`);
      form.reset({
        pattern: "german-bangla-english", // Keep the fixed pattern
        words: "",
        section: "",
      });
      setSection("");
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

  const handleCopyPrompt = () => {
    if (promptRef.current) {
      const text = promptRef.current.innerText;
      navigator.clipboard.writeText(text);
      toast.success("Prompt copied to clipboard!");
    }
  };

  // Sync section state with form
  const handleSectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSection(value);
    form.setValue("section", value, { shouldValidate: true });
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
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="relative">
              Enter words with their translations in the following format:
              <br />
                  <br />
              <code className="text-sm">German word with article-Bangla translation-English translation-Example sentence</code>
              <br /><br />
              Example: {patternInstructions["german-bangla-english"].example}
              <br /><br />
              Prompt: {" "}
              <span>"</span>
              <span ref={promptRef} className="">
              Give me translation list of German words followed by Bangla and English translations in this exact format: German-বাংলা-English-Example Sentence. Use only two hyphens per line - (if there is example sentence matching in given text then three) one between German and Bangla, one between Bangla and English and last one between English and example sentence if there is any . Never use extra hyphens, dashes, or slashes inside any translation. Use simple, clean Bangla and English words. Example: Haus-বাড়ি-house-Das Haus ist groß. If a word refers to multiple meanings (like 'Eltern'), choose one clear equivalent. For nouns, always include the definite article (der, die, or das) with the word.
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
                  <div className="grid grid-cols-5 gap-4 p-4 font-medium border-b">
                    <div>German</div>
                    <div>Bangla</div>
                    <div>English</div>
                    <div>Example</div>
                    <div>Section</div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {parsedWords.map((word, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-5 gap-4 p-4 border-b last:border-0"
                      >
                        <div>{word.germanWord}</div>
                        <div>{word.translationTwo}</div>
                        <div>{word.translationOne}</div>
                        <div>{word.exampleSentence || "-"}</div>
                        <div>{word.section}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center gap-4">
            <div className="w-32">
              <Label htmlFor="section" className="sr-only">Section Number</Label>
              <Input
                id="section"
                type="text"
                value={section}
                onChange={handleSectionChange}
                placeholder="Section #"
              />
            </div>
            <Button type="submit" disabled={isAdding || parsedWords.length === 0 || !section}>
              {isAdding ? "Adding..." : `Add ${parsedWords.length} Words`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}