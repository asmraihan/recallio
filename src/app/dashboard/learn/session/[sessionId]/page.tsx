"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Star, Undo } from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";

interface Word {
  id: string;
  germanWord: string;
  englishTranslation: string | null;
  banglaTranslation: string | null;
  section: number;
  important?: boolean;
}

interface CardState {
  word: Word;
  answered: boolean;
  isCorrect?: boolean;
}

export default function LearningSessionPage() {
  const router = useRouter();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [loading, setLoading] = useState(true);
  const [words, setWords] = useState<Word[]>([]);
  const [cards, setCards] = useState<CardState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [important, setImportant] = useState<Record<string, boolean>>({});
  const [showContinueHint, setShowContinueHint] = useState(false);
  const [dragFeedback, setDragFeedback] = useState<null | 'plus' | 'minus'>(null);
  const [lastUnansweredIndex, setLastUnansweredIndex] = useState<number>(0);

  const x = useMotionValue(0);
  const cardRotate = useTransform(x, [-300, 0, 300], [-45, 0, 45]);

  const leftIndicatorProgress = useTransform(x, [-300, 0], [1, 0]);
  const rightIndicatorProgress = useTransform(x, [0, 300], [0, 1]);

  useEffect(() => {
    async function fetchSession() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/learn/sessions/${sessionId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch session data");
        }
        const data = await res.json();
        const fetchedWords = data.words || [];
        setWords(fetchedWords);
        setCards(fetchedWords.map((word: Word & { answeredAt?: string | null, isCorrect?: boolean | null }) => ({
          word,
          answered: !!word.answeredAt,
          isCorrect: word.isCorrect ?? undefined
        })));
        // Calculate correct/incorrect counts from DB data
        const correct = fetchedWords.filter((w: { isCorrect?: boolean }) => w.isCorrect === true).length;
        const incorrect = fetchedWords.filter((w: { isCorrect?: boolean }) => w.isCorrect === false).length;
        setCorrectCount(correct);
        setIncorrectCount(incorrect);
        // Set currentIndex to first unanswered card, or last card if all answered
        const firstUnanswered = fetchedWords.findIndex((w: { answeredAt?: string | null }) => !w.answeredAt);
        setCurrentIndex(firstUnanswered === -1 ? fetchedWords.length - 1 : firstUnanswered);
        setLastUnansweredIndex(firstUnanswered === -1 ? fetchedWords.length - 1 : firstUnanswered);

        // Initialize important state from backend
        const importantMap: Record<string, boolean> = {};
        fetchedWords.forEach((w: Word) => {
          importantMap[w.id] = !!w.important;
        });
        setImportant(importantMap);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    if (sessionId) fetchSession();
  }, [sessionId]);

  const handleDragEnd = async (_: unknown, info: { offset: { x: number }, velocity: { x: number } }) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    const direction = offset < 0 ? "left" : "right";

    setDragFeedback(null);

    if (showContinueHint) setShowContinueHint(false);

    // If on the last unanswered card, allow answering
    if (currentIndex === lastUnansweredIndex && !currentCard.answered) {
      if (Math.abs(offset) > 100 || Math.abs(velocity) > 500) {
        const isCorrect = direction === "left";
        await handleCardAnswer(isCorrect);
      }
    } else if (currentIndex < lastUnansweredIndex) {
      // If on a previous card, swiping returns to last unanswered card (no answer, no DB call)
      if (Math.abs(offset) > 100 || Math.abs(velocity) > 500) {
        setCurrentIndex(lastUnansweredIndex);
        setIsFlipped(false);
        setShowContinueHint(false);
      }
    }
  };

  const toggleFlip = () => {
    if (!currentCard.answered) {
      setIsFlipped(prev => !prev);
    }
  };

  const handleCardAnswer = async (isCorrect: boolean) => {
    // Prevent reevaluation: do not allow answering already answered cards
    if (currentCard.answered) return;

    // Optimistically update UI
    setCards(prev => {
      const newCards = [...prev];
      newCards[currentIndex] = {
        ...newCards[currentIndex],
        answered: true,
        isCorrect
      };
      return newCards;
    });
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    } else {
      setIncorrectCount(prev => prev + 1);
    }

    // Find the next unanswered card index after answering (use callback to get latest state)
    setTimeout(() => {
      setCards(prevCards => {
        const nextUnanswered = prevCards.findIndex((c, idx) => idx > currentIndex && !c.answered);
        if (nextUnanswered === -1) {
          setCompleted(true);
          setCurrentIndex(prevCards.length - 1);
          setLastUnansweredIndex(prevCards.length - 1);
        } else {
          setCurrentIndex(nextUnanswered);
          setLastUnansweredIndex(nextUnanswered);
          setIsFlipped(false);
        }
        return prevCards;
      });
    }, 250);

    // Fire-and-forget API call
    fetch(`/api/learn/sessions/${sessionId}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId: currentCard.word.id, isCorrect }),
    }).then(res => {
      if (!res.ok) throw new Error();
    }).catch(() => {
      toast.error("Failed to save answer. Please check your connection.");
      // Optionally: add retry logic or mark as unsynced for later sync
    });
  };

  const handleMarkImportant = async (word: Word) => {
    const newValue = !important[word.id];
    setImportant(prev => ({ ...prev, [word.id]: newValue }));
    try {
      await fetch(`/api/learn/words/${word.id}/important`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ important: newValue }),
      });
      toast.success(newValue ? "Marked as important" : "Unmarked as important");
    } catch {
      toast.error("Failed to update important status");
    }
  };

  const goToPreviousCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => {
        const newIndex = prev - 1;
        setIsFlipped(false);
        setShowContinueHint(true);
        // Do NOT reset answered/isCorrect state here!
        return newIndex;
      });
    }
  };

  // Show drag feedback on drag
  const handleDrag = (_: unknown, info: { offset: { x: number } }) => {
    if (!currentCard.answered) {
      if (info.offset.x < -20) setDragFeedback('plus');
      else if (info.offset.x > 20) setDragFeedback('minus');
      else setDragFeedback(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  if (!words.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <p className="text-muted-foreground mb-4">No words found for this session.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Session Complete!</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <div className="text-2xl font-bold mb-4">Great job!</div>
            <div className="flex gap-4 mb-4">
              <div className="text-green-600">✓ {correctCount} correct</div>
              <div className="text-red-600">✗ {incorrectCount} incorrect</div>
            </div>
            <Button onClick={() => router.push('/dashboard/learn')}>Back to Learn</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className={clsx(
              "card-container",
              dragFeedback === 'plus' && 'border-3 border-green-300 rounded-2xl',
              dragFeedback === 'minus' && 'border-3 border-red-300 rounded-2xl'
            )}
            style={{ x, rotate: cardRotate, opacity: 1 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            onDrag={handleDrag}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            whileTap={{ cursor: currentIndex === lastUnansweredIndex && !currentCard.answered ? "grabbing" : "grab" }}
          >
            <Card
              className={clsx(
                "relative cursor-grab select-none transform-gpu card-content perspective-1000",
                "border-2 overflow-hidden hover:cursor-grab active:cursor-grabbing shadow-xl",
                "transition-transform duration-500",
                "min-h-[420px] md:min-h-[440px] lg:min-h-[480px]"
              )}
              onClick={toggleFlip}
              style={{ opacity: 1 }}
            >
              {/* Star Button and Progress Pills (not rotating) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkImportant(currentCard.word);
                }}
                className="absolute top-4 right-4 z-10"
              >
                <Star
                  className={clsx(
                    "h-6 w-6 transition-colors",
                    important[currentCard.word.id] ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                  )}
                />
              </button>
              <div className="absolute top-4 left-4 flex gap-2 min-w-[110px]">
                {dragFeedback === 'plus' ? (
                  <motion.div
                    key="plus"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700 font-bold"
                  >
                    +1
                  </motion.div>
                ) : dragFeedback === 'minus' ? (
                  <motion.div
                    key="minus"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="rounded-full bg-red-100 px-3 py-1 text-sm text-red-700 font-bold"
                  >
                    -1
                  </motion.div>
                ) : (
                  <>
                    <div className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
                      ✓ {correctCount}
                    </div>
                    <div className="rounded-full bg-red-100 px-3 py-1 text-sm text-red-700">
                      ✗ {incorrectCount}
                    </div>
                  </>
                )}
              </div>

              {/* Rotating Content */}
              <motion.div
                className="relative w-full h-full"
                style={{
                  perspective: 1000,
                  minHeight: 300, // increased from 240
                }}
              >
                <motion.div
                  className="absolute inset-0 w-full h-full"
                  style={{
                    rotateX: isFlipped ? 180 : 0,
                    opacity: isFlipped ? 0 : 1,
                    backfaceVisibility: "hidden",
                    transition: "transform 0.5s, opacity 0.3s"
                  }}
                  animate={{ rotateX: isFlipped ? 180 : 0, opacity: isFlipped ? 0 : 1 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <CardContent className="p-6 flex items-center justify-center min-h-[280px] md:min-h-[340px] lg:min-h-[400px]">
                    <div className="text-2xl font-bold">
                      {currentCard.word.germanWord}
                    </div>
                  </CardContent>
                </motion.div>
                <motion.div
                  className="absolute inset-0 w-full h-full"
                  style={{
                    rotateX: isFlipped ? 0 : -180,
                    opacity: isFlipped ? 1 : 0,
                    backfaceVisibility: "hidden",
                    transition: "transform 0.5s, opacity 0.3s"
                  }}
                  animate={{ rotateX: isFlipped ? 0 : -180, opacity: isFlipped ? 1 : 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <CardContent className="p-6 flex flex-col items-center justify-center min-h-[280px] md:min-h-[340px] lg:min-h-[400px]">
                    <p className="text-2xl font-bold mb-4">{currentCard.word.englishTranslation}</p>
                    {currentCard.word.banglaTranslation && (
                      <p className="text-lg text-gray-600">{currentCard.word.banglaTranslation}</p>
                    )}
                  </CardContent>
                </motion.div>
              </motion.div>

              {/* Swipe progress indicators (not rotating) */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ opacity: leftIndicatorProgress }}
              >
                <div className="absolute inset-0 bg-green-500/10" />
                <div className="absolute left-1/4 bottom-1/3 -translate-y-1/2 text-green-300 text-lg font-bold">
                  Know
                </div>
              </motion.div>
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ opacity: rightIndicatorProgress }}
              >
                <div className="absolute inset-0 bg-red-500/10" />
                <div className="absolute right-1/4  bottom-1/3 -translate-y-1/2 text-red-300 text-lg font-bold">
                  Don&apos;t Know
                </div>
              </motion.div>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Mobile Previous Button */}
        {currentIndex > 0 && (
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              goToPreviousCard();
            }}
            className="absolute -left-4 -bottom-4 z-10 bg-background shadow-md"
          >
            <Undo className="h-4 w-4" />
          </Button>
        )}
      </motion.div>

      {/* Desktop Navigation */}
      {/* REMOVE DESKTOP NAVIGATION BUTTONS */}

      {/* Mobile Instructions */}
      <p className="text-center text-sm text-gray-500 mt-4">
        {showContinueHint ? (
          <span className="text-blue-500">Drag card in any direction to continue learning.</span>
        ) : currentIndex < lastUnansweredIndex ? (
          <span className="text-blue-500">Drag to return to current card</span>
        ) : (
          "Tap to flip • Drag left for \"Know\" • Drag right for \"Don't Know\""
        )}
      </p>
    </div>
  );
}