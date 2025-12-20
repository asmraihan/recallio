"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, Trash2, Star, Volume2, ChevronLeft, ChevronRight, Eye, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";

// Match the database schema
interface Word {
  id: string;
  germanWord: string;
  translationOne: string | null;
  translationTwo: string | null;
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
  rowSelection?: Record<string, boolean>;
  onRowSelectionChange?: (updater: any) => void;
  columnVisibility?: Record<string, boolean>;
  onColumnVisibilityChange?: (updater: any) => void;
}

export function WordList({ words, rowSelection: rowSelectionProp, onRowSelectionChange, columnVisibility: columnVisibilityProp, onColumnVisibilityChange }: WordListProps) {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsAudio, setTtsAudio] = useState<HTMLAudioElement | null>(null);
  const [isAutoplayOn, setIsAutoplayOn] = useState(false);
  const [internalRowSelection, setInternalRowSelection] = useState<Record<string, boolean>>({});
  const [internalColumnVisibility, setInternalColumnVisibility] = useState<Record<string, boolean>>({
    germanWord: true,
    translationOne: true,
    translationTwo: true,
    section: true,
    exampleSentence: true,
    actions: true,
  });
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
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('TTS request failed');
      }

      const data = await response.json();
      
      if (ttsAudio) {
        ttsAudio.pause();
        ttsAudio.src = '';
      }

      const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
      setTtsAudio(audio);
      await audio.play();
    } catch {
      toast.error("TTS playback failed");
    } finally {
      setTtsLoading(false);
    }
  }

  const handleViewClose = () => {
    setViewIndex(null);
    setIsAutoplayOn(false);
  };
  const handlePrev = () => setViewIndex(i => (i !== null && i > 0 ? i - 1 : i));
  const handleNext = () => setViewIndex(i => (i !== null && i < words.length - 1 ? i + 1 : i));

  // State for sentence translation
  const [sentenceTranslation, setSentenceTranslation] = useState<string | null>(null);
  const [translationLoading, setTranslationLoading] = useState(false);

  // Translate sentence using browser AI API when viewing a word
  useEffect(() => {
    if (viewIndex === null) {
      setSentenceTranslation(null);
      return;
    }

    const sentence = words[viewIndex]?.exampleSentence;
    if (!sentence) {
      setSentenceTranslation(null);
      return;
    }

    const translateSentence = async () => {
      setTranslationLoading(true);
      try {
        // Check if Translator API is available in the browser
        if (typeof (window as any).Translator === "undefined") {
          console.log("Translator API not available in this browser");
          setSentenceTranslation(null);
          return;
        }

        // Check availability of English to German translation
        const availability = await (window as any).Translator.availability({
          sourceLanguage: "en",
          targetLanguage: "de",
        });

        if (availability === "unavailable") {
          console.log("Translation model not available");
          setSentenceTranslation(null);
          return;
        }

        // Create translator instance (may download model if needed)
        const translator = await (window as any).Translator.create({
          sourceLanguage: "de",
          targetLanguage: "en",
        });

        // Translate the sentence
        const translation = await translator.translate(sentence);
        console.log("Translation result:", translation);
        setSentenceTranslation(translation);

        // Clean up resources
        translator.destroy();
      } catch (error) {
        console.log("Translation failed:", error);
        setSentenceTranslation(null);
      } finally {
        setTranslationLoading(false);
      }
    };

    translateSentence();
  }, [viewIndex, words]);

  const columns = useMemo<ColumnDef<Word>[]>(() => [
    {
      id: "select",
      header: ({ table }: any) => (
                <div className="flex items-center">
        <Checkbox
          className="border border-border"
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value: any) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
      
        />
        </div>
      ),
      cell: ({ row }: any) => (
              <div className="flex items-center">
        <Checkbox
        className="border border-border"
          checked={row.getIsSelected()}
          onCheckedChange={(value: any) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "germanWord",
      header: "German",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => playTTS(row.original.germanWord)}
            disabled={ttsLoading}
          >
            <Volume2 className="h-3 w-3" />
          </Button>
          {row.original.germanWord}
        </div>
      ),
    },
    {
      accessorKey: "translationOne",
      header: "English",
      cell: (info: any) => info.getValue() || <span className="text-muted-foreground">N/A</span>,
    },
    {
      accessorKey: "translationTwo",
      header: "Bangla",
      cell: (info: any) => info.getValue() || <span className="text-muted-foreground">N/A</span>,
    },
    {
      accessorKey: "section",
      header: "Section",
    },
    {
      accessorKey: "exampleSentence",
      header: "Sentence",
      cell: ({ row }: any) => (
        row.original.exampleSentence ? (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => playTTS(row.original.exampleSentence!)}
              disabled={ttsLoading}
            >
              <Volume2 className="h-3 w-3" />
            </Button>
            <span className="italic">{row.original.exampleSentence}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        )
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewIndex(row.index)}
            title="View word details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            asChild
          >
            <a href={`/dashboard/words/${row.original.id}/edit`} title="Edit word">
              <Pencil className="h-4 w-4" />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPendingDeleteId(row.original.id)}
            disabled={isDeleting === row.original.id}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [playTTS, ttsLoading, isDeleting]);

  const handleRowSelectionChange = (updater: any) => {
    if (onRowSelectionChange) return onRowSelectionChange(updater);
    setInternalRowSelection((old) => (typeof updater === "function" ? updater(old) : updater));
  };

  const handleColumnVisibilityChange = (updater: any) => {
    if (onColumnVisibilityChange) return onColumnVisibilityChange(updater);
    setInternalColumnVisibility((old) => (typeof updater === "function" ? updater(old) : updater));
  };

  const table = useReactTable({
    data: words,
    columns,
    state: {
      rowSelection: rowSelectionProp ?? internalRowSelection,
      columnVisibility: columnVisibilityProp ?? internalColumnVisibility,
    },
    onRowSelectionChange: handleRowSelectionChange,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    getRowId: (row: any) => row.id,
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="rounded-md border overflow-x-auto">
      <table className="min-w-full divide-y">
        <thead className="bg-muted/20">
          {table.getHeaderGroups().map((headerGroup: any) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header: any) => {
                // align select column center, actions right, others left
                const thClass = `px-4 py-3 text-sm font-medium text-muted-foreground align-middle ${header.column.id === 'select' ? 'text-center' : header.column.id === 'actions' ? 'text-right' : 'text-left'}`;
                return (
                  <th key={header.id} className={thClass}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.map((row: any) => (
            <tr key={row.id} className="border-t">
              {row.getVisibleCells().map((cell: any) => {
                const tdClass = `px-4 py-3 align-middle text-sm ${cell.column.id === 'select' ? 'text-center' : cell.column.id === 'actions' ? 'text-right' : 'text-left'}`;
                return (
                  <td key={cell.id} className={tdClass}>
                    <div className={cell.column.id === 'actions' ? 'flex justify-end items-center gap-2' : 'flex items-center gap-2'}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="text-center text-muted-foreground p-6">
                No words added yet. Start by adding your first word!
              </td>
            </tr>
          )}
        </tbody>
      </table>
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
                  <span className="mt-1 text-lg ">{words[viewIndex] && words[viewIndex].translationOne || <span className="text-muted-foreground">N/A</span>}</span>
                </div>
                <div className="flex flex-col items-center px-3 py-2 rounded-lg bg-muted/50">
                  <span className="mt-1 text-lg ">{words[viewIndex] && words[viewIndex].translationTwo || <span className="text-muted-foreground">N/A</span>}</span>
                </div>
              </div>

              {/* Example Sentence */}
              <div className="px-3 py-2 rounded-lg">
                {words[viewIndex] && words[viewIndex].exampleSentence ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => playTTS(words[viewIndex].exampleSentence!)}
                        disabled={ttsLoading}
                      >
                        <Volume2 className="h-4 w-4" />
                      </Button>
                      <span className="italic">{words[viewIndex].exampleSentence}</span>
                    </div>
                    {/* Translation using browser AI API */}
                    {sentenceTranslation && (
                      <div className="text-sm italic text-muted-foreground pl-9 border-l-2 border-muted">
                        {sentenceTranslation}
                      </div>
                    )}
                    {translationLoading && (
                      <div className="text-xs text-muted-foreground pl-9">
                        Translating...
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">Sentence: N/A</span>
                )}
              </div>

              {/* Notes */}
              <div className="px-3 py-2  rounded-lg  ">
                <span className="ml-2">{ words[viewIndex] && words[viewIndex].notes || <span className="text-muted-foreground">Notes: N/A</span>}</span>
              </div>

              {/* Navigation arrows at bottom */}
              <div className="flex flex-col gap-2 mt-2">
                {/* Autoplay controls */}
                

                {/* Navigation controls */}
                <div className="flex gap-2">
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
                    <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setIsAutoplayOn(!isAutoplayOn)}
                    className=""
                  >
                    {isAutoplayOn ? (
                      <><Pause className="h-5 w-5" /> </>
                    ) : (
                      <><Play className="h-5 w-5" /> </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}