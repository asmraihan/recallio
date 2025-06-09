import { Metadata } from "next";
import { AddWordForm } from "@/components/words/add-word-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Add Single Word | Recallio",
  description: "Add a new word to your vocabulary collection",
};

export default function AddSingleWordPage() {
  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Single Word</h1>
        <p className="text-muted-foreground mt-2">
          Add a new word to your vocabulary collection with detailed information
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Word Details</CardTitle>
          <CardDescription>
            Enter the word in German, English, and Bangla, along with any additional information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddWordForm />
        </CardContent>
      </Card>
    </div>
  );
} 