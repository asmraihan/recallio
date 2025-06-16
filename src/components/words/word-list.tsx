"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

interface WordListProps {
  words: Word[];
}

export function WordList({ words }: WordListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    try {
      setIsDeleting(id);
      const response = await fetch(`/api/words/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete word");
      }

      toast.success("Word deleted successfully");
      // Refresh the page to update the list
      window.location.reload();
    } catch {
      toast.error("Failed to delete word");
    } finally {
      setIsDeleting(null);
      setPendingDeleteId(null);
    }
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>German</TableHead>
            <TableHead>English</TableHead>
            <TableHead>Bangla</TableHead>
            <TableHead>Section</TableHead>
            {/* <TableHead>Example</TableHead>
            <TableHead>Notes</TableHead> */}
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {words.map((word) => (
            <TableRow key={word.id}>
              <TableCell className="font-medium">{word.germanWord}</TableCell>
              <TableCell>{word.englishTranslation || <span className="text-muted-foreground">N/A</span>}</TableCell>
              <TableCell>{word.banglaTranslation || <span className="text-muted-foreground">N/A</span>}</TableCell>
              <TableCell>{word.section}</TableCell>
              {/* <TableCell>{word.exampleSentence || <span className="text-muted-foreground">N/A</span>}</TableCell>
              <TableCell>{word.notes || <span className="text-muted-foreground">N/A</span>}</TableCell> */}
              <TableCell>{word.createdAt.toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                  >
                    <a href={`/dashboard/words/${word.id}/edit`} title="Edit word">
                      <Pencil className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPendingDeleteId(word.id)}
                    disabled={isDeleting === word.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {words.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                No words added yet. Start by adding your first word!
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {/* Confirm Delete Modal */}
      <Dialog open={!!pendingDeleteId} onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Word?</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this word? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDeleteId(null)} disabled={!!isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => handleDelete(pendingDeleteId!)} disabled={!!isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}