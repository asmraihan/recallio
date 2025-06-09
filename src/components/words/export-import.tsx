"use client";

import { useState } from "react";
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

export function ExportDialog() {
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = async () => {
    try {
      const response = await fetch("/api/words/export");
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Words</DialogTitle>
          <DialogDescription>
            Download your words as a CSV file.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <Button onClick={handleExport} variant="outline">
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