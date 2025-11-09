'use client';

import React, { useState } from 'react';
import { useServiceStatus, type ServiceIssue } from './ServiceStatusProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronUp,
  ChevronDown,
  X,
  RefreshCw,
  LogOut,
  Settings
} from 'lucide-react';
import { useAuthStatus, useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';
import ForceSyncButton from './ForceSyncButton';

export default function ServiceStatusFooter() {
  const { issues, clearIssues, resolveIssue } = useServiceStatus();
  const { isAuthenticated, isLoading } = useAuthStatus();
  const { logout } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const activeIssues = issues.filter(issue => !issue.resolved);
  const resolvedIssues = issues.filter(issue => issue.resolved);

  // Show footer if there are issues, recently resolved issues, or user is authenticated
  // Hide if explicitly dismissed and no critical issues
  const hasIssues = activeIssues.length > 0 || resolvedIssues.length > 0;
  const shouldShow = isVisible && (hasIssues || (isAuthenticated && !isLoading));

  if (!shouldShow) {
    return null;
  }

  const getSeverityIcon = (severity: ServiceIssue['severity']) => {
    switch (severity) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: ServiceIssue['severity']) => {
    switch (severity) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getOverallStatus = () => {
    if (activeIssues.length === 0) {
      // If user is authenticated but no issues, show user status
      if (isAuthenticated && resolvedIssues.length === 0) {
        return {
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
          text: 'Logged In - All Services Operational',
          color: 'text-green-700'
        };
      }
      return {
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        text: 'All Services Operational',
        color: 'text-green-700'
      };
    }

    const hasHighSeverity = activeIssues.some(issue => issue.severity === 'high');
    const hasMediumSeverity = activeIssues.some(issue => issue.severity === 'medium');

    if (hasHighSeverity) {
      return {
        icon: <AlertCircle className="h-4 w-4 text-red-500" />,
        text: `Service Outage (${activeIssues.length} issue${activeIssues.length > 1 ? 's' : ''})`,
        color: 'text-red-700'
      };
    }

    if (hasMediumSeverity) {
      return {
        icon: <AlertCircle className="h-4 w-4 text-yellow-500" />,
        text: `Partial Outage (${activeIssues.length} issue${activeIssues.length > 1 ? 's' : ''})`,
        color: 'text-yellow-700'
      };
    }

    return {
      icon: <Clock className="h-4 w-4 text-blue-500" />,
      text: `Minor Issues (${activeIssues.length} issue${activeIssues.length > 1 ? 's' : ''})`,
      color: 'text-blue-700'
    };
  };

  const status = getOverallStatus();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-lg">
      <Card className="rounded-none border-0 border-t">
        <CardContent className="p-0">
          {/* Main Status Bar */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {status.icon}
              <span className={`text-sm font-medium ${status.color}`}>
                {status.text}
              </span>
              {activeIssues.length > 0 && (
                <span className="text-xs text-gray-500">
                  Affected: {[...new Set(activeIssues.map(issue => issue.service))].join(', ')}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {activeIssues.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-7 px-2"
                >
                  Details
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3 ml-1" />
                  ) : (
                    <ChevronUp className="h-3 w-3 ml-1" />
                  )}
                </Button>
              )}

              {/* Admin button for authenticated users */}
              {isAuthenticated && (
                <Link href="/engine/admin">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Admin
                  </Button>
                </Link>
              )}

              {/* Force Sync button for authenticated users */}
              {isAuthenticated && (
                <ForceSyncButton
                  variant="button"
                  size="sm"
                  className="h-7 px-2"
                />
              )}

              {/* Logout button for authenticated users */}
              {isAuthenticated && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="h-7 px-2"
                >
                  <LogOut className="h-3 w-3 mr-1" />
                  Logout
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="h-7 w-7 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="border-t bg-gray-50 p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900">Service Status Details</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.reload()}
                      className="h-7 px-2"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearIssues}
                      className="h-7 px-2"
                    >
                      Clear All
                    </Button>
                  </div>
                </div>

                {/* Active Issues */}
                {activeIssues.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      Current Issues
                    </h4>
                    <div className="space-y-2">
                      {activeIssues.map((issue, index) => (
                        <div
                          key={`${issue.service}-${index}`}
                          className={`flex items-start gap-3 p-3 rounded-md border ${getSeverityColor(issue.severity)}`}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {getSeverityIcon(issue.severity)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {issue.service}
                              </span>
                              <span className="text-xs text-gray-500">
                                {issue.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">
                              {issue.issue}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resolveIssue(issue.service)}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recently Resolved Issues */}
                {resolvedIssues.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      Recently Resolved
                    </h4>
                    <div className="space-y-1">
                      {resolvedIssues.slice(0, 3).map((issue, index) => (
                        <div
                          key={`resolved-${issue.service}-${index}`}
                          className="flex items-center gap-2 text-sm text-gray-600"
                        >
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="font-medium">{issue.service}</span>
                          <span>-</span>
                          <span>{issue.issue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 pt-2 border-t">
                  Service status is monitored in real-time. Issues are automatically detected and reported here instead of causing page failures.
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}