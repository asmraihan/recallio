"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getLanguageLabels, DEFAULT_LANGUAGE_PREFERENCES } from "@/lib/languages";
import type { UserLanguagePreferences } from "@/lib/languages";

export function AddWordForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [languagePrefs, setLanguagePrefs] = useState<UserLanguagePreferences>(DEFAULT_LANGUAGE_PREFERENCES);

  useEffect(() => {
    const fetchLanguagePreferences = async () => {
      try {
        const response = await fetch("/api/user/languages");
        if (response.ok) {
          const data = await response.json();
          setLanguagePrefs(data);
        }
      } catch (error) {
        console.error("Failed to fetch language preferences:", error);
      }
    };
    fetchLanguagePreferences();
  }, []);

  const getFormSchema = (prefs: UserLanguagePreferences) => {
    return z.object({
      mainWord: z.string().min(1, `${prefs.mainLanguage} word is required`),
      translation1: z.string().optional(),
      translation2: z.string().optional(),
      exampleSentence: z.string().optional(),
      notes: z.string().optional(),
      section: z.string().min(1, "Section is required"),
    }).refine(
      (data) => data.translation1 || data.translation2,
      {
        message: "At least one translation must be provided",
        path: ["translation1", "translation2"],
      }
    );
  };

  const formSchema = getFormSchema(languagePrefs);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mainWord: "",
      translation1: "",
      translation2: "",
      exampleSentence: "",
      notes: "",
      section: "",
    },
    mode: "onChange",
  });

  const values = form.watch();
  const isValid = form.formState.isValid;
  const showPreview = isValid && values.mainWord;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      const response = await fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error && data.error.toLowerCase().includes("duplicate")) {
          toast.error("This word already exists in this section.");
        } else {
          toast.error(data.error || "Something went wrong");
        }
        return;
      }

      toast.success(data.message || "Word added successfully");
      form.reset();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  if (!languagePrefs) {
    return <div>Loading language preferences...</div>;
  }

  const labels = getLanguageLabels(languagePrefs);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="mainWord"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{labels.mainLanguage} Word</FormLabel>
              <FormControl>
                <Input placeholder={`Enter ${labels.mainLanguage} word`} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="translation1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{labels.translation1} Translation </FormLabel>
              <FormControl>
                <Input placeholder={`Enter ${labels.translation1} translation`} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="translation2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{labels.translation2} Translation (optional)</FormLabel>
              <FormControl>
                <Input placeholder={`Enter ${labels.translation2} translation`} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="exampleSentence"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Example Sentence (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter an example sentence"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional notes"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="section"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Section</FormLabel>
              <FormControl>
                <Input placeholder="Section (e.g., 1)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Adding..." : "Add Word"}
        </Button>
      </form>
      {showPreview && (
        <div className="mt-6 rounded border bg-muted/30 p-4">
          <h4 className="mb-2 font-semibold">Preview</h4>
          <div className="grid grid-cols-2 gap-2">
            <div><b>{labels.mainLanguage}:</b> {values.mainWord}</div>
            <div><b>{labels.translation1}:</b> {values.translation1 || <span className="text-muted-foreground">N/A</span>}</div>
            <div><b>{labels.translation2}:</b> {values.translation2 || <span className="text-muted-foreground">N/A</span>}</div>
            <div><b>Section:</b> {values.section}</div>
            <div className="col-span-2"><b>Example:</b> {values.exampleSentence || <span className="text-muted-foreground">N/A</span>}</div>
            <div className="col-span-2"><b>Notes:</b> {values.notes || <span className="text-muted-foreground">N/A</span>}</div>
          </div>
        </div>
      )}
    </Form>
  );
}