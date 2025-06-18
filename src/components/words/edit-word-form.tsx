"use client";

import { useState } from "react";
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

const formSchema = z.object({
  germanWord: z.string().min(1, "German word is required"),
  englishTranslation: z.string().optional(),
  banglaTranslation: z.string().optional(),
  exampleSentence: z.string().optional(),
  notes: z.string().optional(),
  section: z.string().min(1, "Section is required"),
}).refine(
  (data) => data.englishTranslation || data.banglaTranslation,
  {
    message: "Either English or Bangla translation must be provided",
    path: ["englishTranslation", "banglaTranslation"],
  }
);

export function EditWordForm({ word }: { word: any }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      germanWord: word.germanWord || "",
      englishTranslation: word.englishTranslation || "",
      banglaTranslation: word.banglaTranslation || "",
      exampleSentence: word.exampleSentence || "",
      notes: word.notes || "",
      section: word.section || "",
    },
    mode: "onChange",
  });

  const values = form.watch();
  const isValid = form.formState.isValid;
  const showPreview = isValid && values.germanWord;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/words/${word.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Something went wrong");
        return;
      }
      toast.success(data.message || "Word updated successfully");
      router.push(`/dashboard/words?section=${values.section}`);
      // Optionally refresh the words list
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="germanWord"
          render={({ field }) => (
            <FormItem>
              <FormLabel>German Word</FormLabel>
              <FormControl>
                <Input placeholder="Enter German word" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="englishTranslation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>English Translation (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Enter English translation" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="banglaTranslation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bangla Translation (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Enter Bangla translation" {...field} />
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
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </form>
      {showPreview && (
        <div className="mt-6 rounded border bg-muted/30 p-4">
          <h4 className="mb-2 font-semibold">Preview</h4>
          <div className="grid grid-cols-2 gap-2">
            <div><b>German:</b> {values.germanWord}</div>
            <div><b>English:</b> {values.englishTranslation || <span className="text-muted-foreground">N/A</span>}</div>
            <div><b>Bangla:</b> {values.banglaTranslation || <span className="text-muted-foreground">N/A</span>}</div>
            <div><b>Section:</b> {values.section}</div>
            <div className="col-span-2"><b>Example:</b> {values.exampleSentence || <span className="text-muted-foreground">N/A</span>}</div>
            <div className="col-span-2"><b>Notes:</b> {values.notes || <span className="text-muted-foreground">N/A</span>}</div>
          </div>
        </div>
      )}
    </Form>
  );
}
