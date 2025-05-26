"use client";

import { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody, CardHeader } from "@heroui/card";

export default function TestApiPage() {
  const [routineId, setRoutineId] = useState("test-id");
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const testApiCall = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setDebugInfo(null);

    try {
      const res = await fetch(`/api/routines/${routineId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Get debug information
      const contentType = res.headers.get("content-type");
      const responseText = await res.text();
      
      setDebugInfo({
        status: res.status,
        statusText: res.statusText,
        contentType,
        url: res.url,
        redirected: res.redirected,
        responseLength: responseText.length,
        responsePreview: responseText.substring(0, 500) + (responseText.length > 500 ? "..." : "")
      });

      // Try to parse as JSON only if content type suggests it's JSON
      if (contentType && contentType.includes("application/json")) {
        try {
          const data = JSON.parse(responseText);
          if (!res.ok) {
            setError(`Error ${res.status}: ${data.error || 'Unknown error'}`);
          } else {
            setResponse(data);
          }
        } catch (parseError) {
          setError(`JSON Parse Error: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
        }
      } else {
        setError(`Expected JSON but received ${contentType || 'unknown content type'}. Check debug info below.`);
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-default-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-bold">API Route Tester</h1>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="routineId" className="text-sm font-medium">
                Routine ID:
              </label>
              <Input
                id="routineId"
                value={routineId}
                onChange={(e) => setRoutineId(e.target.value)}
                placeholder="Enter routine ID"
              />
            </div>
            
            <Button 
              onClick={testApiCall} 
              isLoading={loading}
              color="primary"
              className="w-full"
            >
              {loading ? "Testing API..." : "Test API Route"}
            </Button>

            {error && (
              <div className="bg-danger-50 text-danger-700 p-4 rounded-lg">
                <h3 className="font-semibold">Error:</h3>
                <p>{error}</p>
              </div>
            )}

            {response && (
              <div className="bg-success-50 text-success-700 p-4 rounded-lg">
                <h3 className="font-semibold">Success Response:</h3>
                <pre className="mt-2 text-sm overflow-auto">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            )}

            {debugInfo && (
              <div className="bg-warning-50 text-warning-700 p-4 rounded-lg">
                <h3 className="font-semibold">Debug Information:</h3>
                <div className="mt-2 space-y-2 text-sm">
                  <p><strong>Status:</strong> {debugInfo.status} {debugInfo.statusText}</p>
                  <p><strong>Content-Type:</strong> {debugInfo.contentType || 'Not set'}</p>
                  <p><strong>URL:</strong> {debugInfo.url}</p>
                  <p><strong>Redirected:</strong> {debugInfo.redirected ? 'Yes' : 'No'}</p>
                  <p><strong>Response Length:</strong> {debugInfo.responseLength} characters</p>
                  <details className="mt-2">
                    <summary className="cursor-pointer font-medium">Response Preview</summary>
                    <pre className="mt-2 text-xs bg-warning-100 p-2 rounded overflow-auto max-h-40">
                      {debugInfo.responsePreview}
                    </pre>
                  </details>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold mb-2">How to properly test API routes:</h2>
            <ul className="space-y-2 text-sm text-default-600">
              <li>• API routes should be called programmatically (like this page does)</li>
              <li>• Don't visit API routes directly in the browser address bar</li>
              <li>• Use fetch(), axios, or similar tools to make API calls</li>
              <li>• API routes return JSON, not HTML pages</li>
              <li>• Check the debug info below if you get errors</li>
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
} 