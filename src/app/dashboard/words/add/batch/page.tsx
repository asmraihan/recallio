import { Metadata } from "next";
import { BatchAddForm } from "@/components/words/batch-add-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Batch Add Words | Recallio",
  description: "Add multiple words to your vocabulary collection at once",
};

export default function BatchAddPage() {
  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Batch Add Words</h1>
        <p className="text-muted-foreground mt-2">
          Add multiple words to your vocabulary collection at once. Choose your input pattern and enter words in the specified format.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Words in Bulk</CardTitle>
          <CardDescription>
            Enter your words in the text area below, following the format instructions.
            You can add up to 100 words at once.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BatchAddForm />
        </CardContent>
      </Card>
    </div>
  );
} 