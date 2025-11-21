"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";

export default function ImportUsersPage() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleImport = async () => {
    // Paste your TSV data here
    const tsvData = `id	email	password	name	role	approved	balance	rating	phone	created_at	updated_at	status	suspended_until	suspension_reason	blacklist_reason	rejected_at	rejection_reason	total_earned	total_spent	completed_jobs	completion_rate	display_id	profile_picture_url	domain_id	last_login_ip	last_login_at	earned	total_earnings	last_login_device	login_count	client_priority	freelancer_badge	client_tier	email_verified	account_id	assigned_manager_id	account_name
1	topwriteessays@gmail.com	$2b$10$uskPsA90VL8s8pgm6syTRO.aFx6TyZK6oKSyXPzC3t8za.cVKbkxa	Admin User 1	admin	1	0		+25470000001	2025-11-02T21:55:40.581Z	2025-11-02T22:14:39.491Z	active						0	0	0		ADMN#0001			::ffff:127.0.0.1	2025-11-08T15:52:03.489Z	0	0	curl/7.88.1	1	regular		basic	0			
2	m.d.techpoint25@gmail.com	$2b$10$uskPsA90VL8s8pgm6syTRO.aFx6TyZK6oKSyXPzC3t8za.cVKbkxa	Admin User 2	admin	1	0		+25470000002	2025-11-02T21:55:40.581Z	2025-11-02T22:14:39.491Z	active						0	0	0		ADMN#0002			102.205.189.19, 172.68.47.130, 10.1.102.98, 100.28.153.11, 172.20.0.1	2025-11-16T00:14:16.986Z	0	0	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	34	regular		basic	0			
3	maguna956@gmail.com	$2b$10$uskPsA90VL8s8pgm6syTRO.aFx6TyZK6oKSyXPzC3t8za.cVKbkxa	Admin User 3	admin	1	0		+25470000003	2025-11-02T21:55:40.581Z	2025-11-02T22:44:50.903Z	active						0	0	0		ADMN#0003					0	0		0	regular		basic	0			
4	tasklynk01@gmail.com	$2b$10$uskPsA90VL8s8pgm6syTRO.aFx6TyZK6oKSyXPzC3t8za.cVKbkxa	Admin User 4	admin	1	0		+25470000004	2025-11-02T21:55:40.581Z	2025-11-02T22:44:32.825Z	active						0	0	0		ADMN#0004		1			0	0		0	regular		basic	0			
5	maxwellotieno11@gmail.com	$2b$10$uskPsA90VL8s8pgm6syTRO.aFx6TyZK6oKSyXPzC3t8za.cVKbkxa	Admin User 5	admin	1	0		+25470000005	2025-11-02T21:55:40.581Z	2025-11-02T22:14:39.491Z	active						0	0	0		ADMN#0005			102.205.189.19	2025-11-14T18:36:31.753Z	0	0	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	62	regular		basic	0			
6	ashleydothy3162@gmail.com	$2b$10$uskPsA90VL8s8pgm6syTRO.aFx6TyZK6oKSyXPzC3t8za.cVKbkxa	Admin User 6	admin	1	0		+25470000006	2025-11-02T21:55:40.581Z	2025-11-02T22:14:39.491Z	active						0	0	0		ADMN#0006			102.205.189.20	2025-11-12T05:37:59.856Z	0	0	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	33	regular		basic	0			`;

    setImporting(true);
    setResult(null);

    try {
      // Parse TSV
      const lines = tsvData.trim().split('\n');
      const headers = lines[0].split('\t');
      
      const users = lines.slice(1).map(line => {
        const values = line.split('\t');
        const user: any = {};
        
        headers.forEach((header, index) => {
          user[header] = values[index] || null;
        });
        
        return user;
      });

      // Import users
      const response = await fetch('/api/admin/import-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userData: users })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Import Complete: ${data.results.imported} new, ${data.results.updated} updated`);
        setResult(data.results);
      } else {
        toast.error(`Import Failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import users');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Import Backed-Up Users</CardTitle>
          <CardDescription>
            Import user data from backup. This will update existing users by email or create new ones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Instructions:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Paste your TSV backup data in the code (src/app/admin/import-users/page.tsx)</li>
                <li>Click the Import button below</li>
                <li>Wait for the import to complete</li>
                <li>Check the results</li>
              </ol>
            </div>

            <Button
              onClick={handleImport}
              disabled={importing}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {importing ? "Importing..." : "Import Users"}
            </Button>

            {result && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Import Results:</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-green-600">{result.imported}</p>
                        <p className="text-sm text-muted-foreground">New Users</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-blue-600">{result.updated}</p>
                        <p className="text-sm text-muted-foreground">Updated Users</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {result.errors.length > 0 && (
                  <div className="bg-destructive/10 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-destructive mb-2">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-semibold">Errors:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-sm text-destructive">
                      {result.errors.map((error: string, i: number) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
