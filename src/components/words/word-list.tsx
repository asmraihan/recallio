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
import { Pencil, Trash2, Star, Volume2, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  important?: boolean;
}

interface WordListProps {
  words: Word[];
}

export function WordList({ words }: WordListProps) {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsAudio, setTtsAudio] = useState<HTMLAudioElement | null>(null);
  // Remove local important state, rely on words prop

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

  async function handleMarkImportant(wordId: string) {
    const word = words.find(w => w.id === wordId);
    if (!word) return;
    const newValue = !word.important;
    try {
      await fetch(`/api/learn/words/${wordId}/important`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ important: newValue }),
      });
      toast.success(newValue ? "Marked as important" : "Unmarked as important");
      // Refetch words so UI updates immediately
      await queryClient.invalidateQueries({ queryKey: ["words"] });
    } catch {
      toast.error("Failed to update important status");
    }
  }

  async function playTTS(text: string) {
    setTtsLoading(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: "de-DE-AmalaNeural" }),
      });
      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      setTtsAudio(audio);
      audio.play();
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setTtsAudio(null);
      };
    } catch {
      toast.error("TTS playback failed");
    } finally {
      setTtsLoading(false);
    }
  }

  const handleViewClose = () => setViewIndex(null);
  const handlePrev = () => setViewIndex(i => (i !== null && i > 0 ? i - 1 : i));
  const handleNext = () => setViewIndex(i => (i !== null && i < words.length - 1 ? i + 1 : i));

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
          {words.map((word, idx) => (
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
                    onClick={() => setViewIndex(idx)}
                    title="View word details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
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
      {/* View Word Modal */}
      <Dialog open={viewIndex !== null} onOpenChange={handleViewClose}>
        <DialogContent className="max-w-[100vw - 2rem] sm:max-w-md">
          <DialogTitle className="">Word Details</DialogTitle>
          {viewIndex !== null && (
            <div className="flex flex-col gap-6">
              {/* Main word panel */}
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-primary/2 border border-primary/10">
                <div className="flex justify-between items-center w-full">
                     <Button variant="ghost" size="icon" onClick={() => playTTS(words[viewIndex].germanWord)} disabled={ttsLoading}>
                    <Volume2 className={ttsLoading ? "animate-pulse h-5 w-5" : "h-5 w-5"} />
                  </Button>
                  <span className="text-2xl font-semibold text-primary">{words[viewIndex]?.germanWord || <span className="text-muted-foreground">N/A</span>}</span>
               
                  <button
                    onClick={() => handleMarkImportant(words[viewIndex].id)}
                    className="ml-1"
                    title={words[viewIndex] && words[viewIndex].important ? "Unmark as important" : "Mark as important"}
                  >
                    {words[viewIndex] && words[viewIndex].important ? (
                      <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    ) : (
                      <Star className="h-5 w-5 text-gray-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Translations */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center px-3  py-2  rounded-lg bg-muted/50">
                  <span className="mt-1 text-lg ">{words[viewIndex] && words[viewIndex].englishTranslation || <span className="text-muted-foreground">N/A</span>}</span>
                </div>
                <div className="flex flex-col items-center px-3 py-2 rounded-lg bg-muted/50">
                  <span className="mt-1 text-lg ">{words[viewIndex] && words[viewIndex].banglaTranslation || <span className="text-muted-foreground">N/A</span>}</span>
                </div>
              </div>

              {/* Example Sentence */}
              <div className="px-3 py-2  rounded-lg">
                <span className="font-semibold text-primary">Example:</span>
                <span className="ml-2">{words[viewIndex] && words[viewIndex].exampleSentence || <span className="text-muted-foreground">N/A</span>}</span>
              </div>

              {/* Notes */}
              <div className="px-3 py-2  rounded-lg  ">
                <span className="font-semibold">Notes:</span>
                <span className="ml-2">{ words[viewIndex] && words[viewIndex].notes || <span className="text-muted-foreground">N/A</span>}</span>
              </div>

              {/* Navigation arrows at bottom */}
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={handlePrev}
                  disabled={viewIndex === 0}
                >
                  <ChevronLeft className="h-5 w-5 mr-2" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={handleNext}
                  disabled={viewIndex === words.length - 1}
                >
                  Next <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}