"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [isDeleteSessionsDialogOpen, setIsDeleteSessionsDialogOpen] = useState(false);
  const [isDeleteWordsDialogOpen, setIsDeleteWordsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteSessions = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/learn/sessions/delete-all", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete sessions");
      }

      toast.success("All learning sessions deleted successfully");
      setIsDeleteSessionsDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete sessions");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteWords = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/words/delete-all", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete words");
      }

      toast.success("All words deleted successfully");
      setIsDeleteWordsDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete words");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="danger">Account Reset</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>
                Manage your account settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Profile settings will be implemented soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger">
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Reset Account</CardTitle>
              <CardDescription>
                These actions are irreversible and will permanently delete your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/20">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">Delete All Learning Sessions</h4>
                  <p className="text-sm text-muted-foreground">
                    This will permanently delete all your learning sessions and progress
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsDeleteSessionsDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Sessions
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/20">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">Delete All Words</h4>
                  <p className="text-sm text-muted-foreground">
                    This will permanently delete all words you have added
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsDeleteWordsDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Words
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Sessions Confirmation Dialog */}
      <Dialog open={isDeleteSessionsDialogOpen} onOpenChange={setIsDeleteSessionsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete All Learning Sessions
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete all your learning sessions
              and reset your learning progress.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteSessionsDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSessions}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete All Sessions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Words Confirmation Dialog */}
      <Dialog open={isDeleteWordsDialogOpen} onOpenChange={setIsDeleteWordsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete All Words
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete all words you have added
              to your vocabulary collection.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteWordsDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteWords}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete All Words"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}