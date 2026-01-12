"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { getExportHeaders } from "@/lib/languages";
import type { UserLanguagePreferences } from "@/lib/languages";

import { Checkbox } from "@/components/ui/checkbox";

type ExportDialogProps = {
  selectedIds?: string[];
  visibleColumns?: string[];
  section?: string; // currently selected section
  totalWords?: number; // total words in the current view
  allowAll?: boolean; // when true, show an "Export all" option
};

export function ExportDialog({ selectedIds, visibleColumns, section, totalWords = 0, allowAll = true }: ExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exportAll, setExportAll] = useState(false);
  const [languagePrefs, setLanguagePrefs] = useState<UserLanguagePreferences | null>(null);

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
        setLanguagePrefs({
          mainLanguage: "German",
          translationLanguages: ["English", "Bangla"]
        });
      }
    };
    fetchLanguagePreferences();
  }, []);

  const columnLabels = languagePrefs ? getExportHeaders(languagePrefs) : {
    mainWord: "Main",
    translation1: "Language 1",
    translation2: "Language 2",
    section: "Section",
    exampleSentence: "Sentence",
    notes: "Notes",
  };

  const numSelected = Array.isArray(selectedIds) ? selectedIds.filter(Boolean).length : 0;
  const hasSelection = numSelected > 0;
  const rowsToExport = exportAll ? totalWords : hasSelection ? numSelected : totalWords;
  const columnsToExport = Array.isArray(visibleColumns) ? visibleColumns.filter(Boolean).length : 0;

  const handleExport = async () => {
    try {
      const payload: any = {};
      if (exportAll) {
        payload.all = true;
      } else if (hasSelection) {
        payload.ids = selectedIds;
      } else {
        // fallback: export all
        payload.all = true;
      }

      if (Array.isArray(visibleColumns) && visibleColumns.length > 0) {
        payload.columns = visibleColumns;
      }

      if (section && section !== "all") {
        payload.section = section;
      }

      const response = await fetch("/api/words/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to export words");
      }

      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : "recallio-words.csv";
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Words exported successfully");
      setIsOpen(false);
      setExportAll(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export words");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Words</DialogTitle>
          <DialogDescription>
            Download your words as a CSV file.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          {allowAll && (
            <div className="flex items-center gap-2">
              <Checkbox
                className="border border-border"
                id="export-all" checked={exportAll} onCheckedChange={(v) => setExportAll(!!v)} />
              <Label htmlFor="export-all" className="cursor-pointer">Export all words</Label>
            </div>
          )}

          {/* Preview Section */}
          <div className="rounded-md bg-muted/50 p-3 space-y-2 text-sm">
            <div className="font-medium text-foreground">Export Preview:</div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Rows:</span>
              <span className="font-medium">{rowsToExport} word{rowsToExport !== 1 ? 's' : ''}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Columns:</span>
              <span className="font-medium">{columnsToExport}</span>
            </div>

            {section && section !== "all" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Section:</span>
                <span className="font-medium">Section {section}</span>
              </div>
            )}

            {section === "all" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Section:</span>
                <span className="font-medium">All Sections</span>
              </div>
            )}

            {hasSelection && !exportAll && (
              <div className="text-xs text-muted-foreground italic pt-2 border-t">
                Exporting {numSelected} selected row{numSelected !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {columnsToExport > 0 && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Columns included:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {visibleColumns?.map((col) => (
                  <span key={col} className="bg-background px-2 py-1 rounded">
                    {columnLabels[col as keyof typeof columnLabels] || col}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Button onClick={handleExport} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Export to CSV
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ImportDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const queryClient = useQueryClient();

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setIsImporting(true);
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/words/import", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to import words");
      }
      const result = await response.json();
      toast.success(result.message || "Imported words successfully");
      await queryClient.invalidateQueries({ queryKey: ["words"] });
      setIsOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to import words");
    } finally {
      setIsImporting(false);
      event.target.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          Import
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Words</DialogTitle>
          <DialogDescription>
            Import words from a CSV file.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Label htmlFor="file">Choose CSV file</Label>
          <Input
            id="file"
            type="file"
            accept=".csv"
            onChange={handleImport}
            disabled={isImporting}
          />
          {isImporting && (
            <p className="text-sm text-muted-foreground">Importing words...</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 