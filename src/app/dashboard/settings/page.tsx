// write demo settings page nextjs

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ScrollArea } from "@/components/ui/scroll-area";


export default function SettingsPage() {


    return (
        <div className="container mx-auto p-4">
            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Profile</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Display user profile information here */}
                            <div className="space-y-4">
                                <p className="text-muted-foreground">
                                    Settings are not implemented yet.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings">
                    <ScrollArea className="h-[calc(100vh-200px)]">
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        </div>
    );
}