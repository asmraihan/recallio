import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Download } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Add Words | Recallio",
  description: "Add words to your vocabulary collection",
};

export default function AddWordPage() {
  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Words</h1>
        <p className="text-muted-foreground mt-2">
          Choose how you want to add words to your vocabulary collection
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Single Word Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Single Word
            </CardTitle>
            <CardDescription>
              Add one word at a time with detailed information like example sentences and notes
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 space-y-4">
              <p className="text-sm text-muted-foreground">
                Perfect for when you want to:
              </p>
              <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
                <li>Add detailed information for each word</li>
                <li>Include example sentences</li>
                <li>Add personal notes or mnemonics</li>
                <li>Carefully review each entry</li>
              </ul>
            </div>
            <Button asChild className="mt-6">
              <Link href="/dashboard/words/add/single">
                Add Single Word
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Batch Add Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Batch Add Words
            </CardTitle>
            <CardDescription>
              Add multiple words at once using a simple text format
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 space-y-4">
              <p className="text-sm text-muted-foreground">
                Best for when you want to:
              </p>
              <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
                <li>Add many words quickly</li>
                <li>Import words from a list</li>
                <li>Add basic translations only</li>
                <li>Add up to 100 words at once</li>
              </ul>
            </div>
            <Button asChild className="mt-6">
              <Link href="/dashboard/words/add/batch">
                Batch Add Words
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Export/Import Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export/Import Words
            </CardTitle>
            <CardDescription>
              Export your words to CSV or import words from a CSV file
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 space-y-4">
              <p className="text-sm text-muted-foreground">
                Use this to:
              </p>
              <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
                <li>Backup your word collection</li>
                <li>Import words from other apps</li>
                <li>Edit words in spreadsheet software</li>
                <li>Share word lists with others</li>
              </ul>
            </div>
            <Button asChild className="mt-6">
              <Link href="/dashboard/words/add/export-import">
                Export/Import Words
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 