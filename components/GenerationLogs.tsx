// components/GenerationLogs.tsx
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'progress' | 'error' | 'success';
}

interface GenerationLogsProps {
  logs: LogEntry[];
  status: string;
  progress: number;
}

export default function GenerationLogs({ logs, status, progress }: GenerationLogsProps) {
  return (
    <div className="space-y-4">
      {/* Status and Progress Section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Status:</span>
              <span className={status === 'COMPLETED' ? 'text-green-500' : 'text-gray-500'}>
                {status || 'Not started'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Section */}
      <Card>
        <CardContent className="p-4">
          <div className="font-medium mb-2">Logs:</div>
          <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet...</div>
            ) : (
              logs.map((log, index) => (
                <div 
                  key={index} 
                  className={`mb-1 ${
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'success' ? 'text-green-400' :
                    log.type === 'progress' ? 'text-blue-400' :
                    'text-gray-300'
                  }`}
                >
                  <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
