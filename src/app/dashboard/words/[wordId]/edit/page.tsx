"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { EditWordForm } from "@/components/words/edit-word-form";

export default function EditWordPage() {
  const router = useRouter();
  const params = useParams();
  const wordId = params?.wordId as string;
  const [word, setWord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!wordId) return;
    setLoading(true);
    fetch(`/api/words/${wordId}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch word");
        }
        return res.json();
      })
      .then(setWord)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [wordId]);

  if (loading) return (
    <div className="flex h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
  if (error) return (
    <div className="flex h-[50vh] items-center justify-center text-destructive">{error}</div>
  );
  if (!word) return null;

  return (
    <div className="container py-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-4">Edit Word</h1>
      <EditWordForm word={word} />
    </div>
  );
}
