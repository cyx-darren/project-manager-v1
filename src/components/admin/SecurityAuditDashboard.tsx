import React, { useState } from 'react'
import { 
  Shield, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Activity,
  Database,
  Globe,
  Lock,
  Server,
  Monitor,
  FileText,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { securityAuditService, type SecurityAuditReport } from '../../services/securityAuditService'
import { performanceAuditService, type PerformanceAuditReport } from '../../services/performanceAuditService'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Alert, AlertTitle, AlertDescription } from '../ui/alert'
import { Progress } from '../ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'

interface AuditProgress {
  isRunning: boolean
  currentStep: string
  progress: number
}

export default function SecurityAuditDashboard() {
  const [securityReport, setSecurityReport] = useState<SecurityAuditReport | null>(null)
  const [performanceReport, setPerformanceReport] = useState<PerformanceAuditReport | null>(null)
  const [auditProgress, setAuditProgress] = useState<AuditProgress>({
    isRunning: false,
    currentStep: '',
    progress: 0
  })
  const [lastAuditTime, setLastAuditTime] = useState<Date | null>(null)

  const runSecurityAudit = async () => {
    setAuditProgress({ isRunning: true, currentStep: 'Running security audit...', progress: 10 })
    
    try {
      setAuditProgress({ isRunning: true, currentStep: 'Analyzing authentication...', progress: 30 })
      const report = await securityAuditService.performComprehensiveAudit()
      
      setAuditProgress({ isRunning: true, currentStep: 'Generating report...', progress: 80 })
      setSecurityReport(report)
      setLastAuditTime(new Date())
      
      setAuditProgress({ isRunning: true, currentStep: 'Completed!', progress: 100 })
      setTimeout(() => {
        setAuditProgress({ isRunning: false, currentStep: '', progress: 0 })
      }, 1000)
      
    } catch (error) {
      console.error('Security audit failed:', error)
      setAuditProgress({ isRunning: false, currentStep: 'Failed', progress: 0 })
    }
  }

  const runPerformanceAudit = async () => {
    setAuditProgress({ isRunning: true, currentStep: 'Running performance audit...', progress: 10 })
    
    try {
      setAuditProgress({ isRunning: true, currentStep: 'Analyzing database performance...', progress: 20 })
      performanceAuditService.startPerformanceMonitoring()
      
      setAuditProgress({ isRunning: true, currentStep: 'Testing API response times...', progress: 40 })
      const report = await performanceAuditService.performComprehensiveAudit()
      
      setAuditProgress({ isRunning: true, currentStep: 'Analyzing frontend metrics...', progress: 70 })
      setPerformanceReport(report)
      setLastAuditTime(new Date())
      
      setAuditProgress({ isRunning: true, currentStep: 'Completed!', progress: 100 })
      setTimeout(() => {
        setAuditProgress({ isRunning: false, currentStep: '', progress: 0 })
        performanceAuditService.stopPerformanceMonitoring()
      }, 1000)
      
    } catch (error) {
      console.error('Performance audit failed:', error)
      setAuditProgress({ isRunning: false, currentStep: 'Failed', progress: 0 })
      performanceAuditService.stopPerformanceMonitoring()
    }
  }

  const runFullAudit = async () => {
    await runSecurityAudit()
    await new Promise(resolve => setTimeout(resolve, 1000)) // Small delay between audits
    await runPerformanceAudit()
  }

  const downloadSecurityReport = async () => {
    try {
      const markdown = await securityAuditService.generateSecurityReport()
      const blob = new Blob([markdown], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `security-audit-${new Date().toISOString().split('T')[0]}.md`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download security report:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variant = status === 'pass' ? 'default' : status === 'fail' ? 'destructive' : 'secondary'
    return <Badge variant={variant}>{status.toUpperCase()}</Badge>
  }

  const getPerformanceStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'critical':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      case 'warning':
        return <Activity className="h-4 w-4 text-yellow-500" />
      default:
        return <Monitor className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security & Performance Audit Dashboard</h1>
          <p className="text-gray-600">
            Comprehensive security and performance monitoring for multi-user collaboration
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={runSecurityAudit} 
            disabled={auditProgress.isRunning}
            className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            <Shield className="h-4 w-4 mr-2" />
            Security Audit
          </Button>
          <Button 
            onClick={runPerformanceAudit} 
            disabled={auditProgress.isRunning}
            className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            <Zap className="h-4 w-4 mr-2" />
            Performance Audit
          </Button>
          <Button 
            onClick={runFullAudit} 
            disabled={auditProgress.isRunning}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${auditProgress.isRunning ? 'animate-spin' : ''}`} />
            Full Audit
          </Button>
        </div>
      </div>

      {/* Audit Progress */}
      {auditProgress.isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{auditProgress.currentStep}</span>
                <span className="text-sm text-gray-600">{auditProgress.progress}%</span>
              </div>
              <Progress value={auditProgress.progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Audit Info */}
      {lastAuditTime && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Last Audit</AlertTitle>
          <AlertDescription>
            Completed on {lastAuditTime.toLocaleString()}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Security Overview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Score</CardTitle>
                <Shield className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {securityReport ? `${securityReport.overallScore}%` : 'No data'}
                </div>
                <p className="text-xs text-gray-600">
                  {securityReport ? (
                    `${securityReport.passed}/${securityReport.totalChecks} checks passed`
                  ) : (
                    'Run security audit to see results'
                  )}
                </p>
                {securityReport && (
                  <div className="mt-2">
                    <Progress 
                      value={securityReport.overallScore} 
                      className="h-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Overview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
                <Zap className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceReport ? `${performanceReport.overallPerformanceScore}%` : 'No data'}
                </div>
                <p className="text-xs text-gray-600">
                  {performanceReport ? (
                    `${performanceReport.criticalIssues.length} critical issues found`
                  ) : (
                    'Run performance audit to see results'
                  )}
                </p>
                {performanceReport && (
                  <div className="mt-2">
                    <Progress 
                      value={performanceReport.overallPerformanceScore} 
                      className="h-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Critical Issues */}
          {((securityReport?.failed ?? 0) > 0 || (performanceReport?.criticalIssues?.length ?? 0) > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Critical Issues Requiring Attention
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {securityReport?.results.filter(r => r.status === 'fail').map((result, index) => (
                  <Alert key={`security-${index}`} variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Security: {result.check}</AlertTitle>
                    <AlertDescription>
                      {result.message}
                      {result.recommendation && (
                        <div className="mt-1 font-medium">
                          Recommendation: {result.recommendation}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
                
                {performanceReport?.criticalIssues.map((issue, index) => (
                  <Alert key={`performance-${index}`} variant="destructive">
                    <TrendingDown className="h-4 w-4" />
                    <AlertTitle>Performance Issue</AlertTitle>
                    <AlertDescription>{issue}</AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          {securityReport ? (
            <div className="space-y-4">
              {/* Security Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">{securityReport.passed}</div>
                    <p className="text-xs text-gray-600">Passed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-red-600">{securityReport.failed}</div>
                    <p className="text-xs text-gray-600">Failed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-yellow-600">{securityReport.warnings}</div>
                    <p className="text-xs text-gray-600">Warnings</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{securityReport.totalChecks}</div>
                    <p className="text-xs text-gray-600">Total Checks</p>
                  </CardContent>
                </Card>
              </div>

              {/* Security Categories */}
              <div className="space-y-4">
                {Object.entries(securityReport.summary).map(([category, results]) => (
                  results.length > 0 && (
                    <Card key={category}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {category === 'authentication' && <Lock className="h-5 w-5" />}
                          {category === 'authorization' && <Shield className="h-5 w-5" />}
                          {category === 'dataAccess' && <Database className="h-5 w-5" />}
                          {category === 'transmission' && <Globe className="h-5 w-5" />}
                          {category === 'sessionManagement' && <Clock className="h-5 w-5" />}
                          {category === 'errorHandling' && <AlertTriangle className="h-5 w-5" />}
                          {category === 'inputValidation' && <CheckCircle className="h-5 w-5" />}
                          {category === 'rateLimit' && <Server className="h-5 w-5" />}
                          {category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {results.map((result, index) => (
                            <div key={index} className="flex items-start justify-between p-3 rounded-lg border">
                              <div className="flex items-start gap-3">
                                {getStatusIcon(result.status)}
                                <div>
                                  <div className="font-medium">{result.check}</div>
                                  <div className="text-sm text-gray-600">{result.message}</div>
                                  {result.recommendation && (
                                    <div className="text-sm text-blue-600 mt-1">
                                      💡 {result.recommendation}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {getStatusBadge(result.status)}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <Shield className="h-12 w-12 mx-auto text-gray-600 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Security Audit Data</h3>
                <p className="text-gray-600 mb-4">
                  Run a security audit to see detailed security analysis results.
                </p>
                <Button onClick={runSecurityAudit} disabled={auditProgress.isRunning}>
                  <Shield className="h-4 w-4 mr-2" />
                  Run Security Audit
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          {performanceReport ? (
            <div className="space-y-4">
              {/* Performance Categories */}
              {Object.entries(performanceReport.categories).map(([category, data]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {category === 'database' && <Database className="h-5 w-5" />}
                        {category === 'frontend' && <Monitor className="h-5 w-5" />}
                        {category === 'api' && <Server className="h-5 w-5" />}
                        {category === 'realtime' && <Activity className="h-5 w-5" />}
                        {category === 'caching' && <Zap className="h-5 w-5" />}
                        {category === 'bundleSize' && <FileText className="h-5 w-5" />}
                        {category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1')}
                      </div>
                      <Badge variant={data.overallScore > 80 ? 'default' : data.overallScore > 60 ? 'secondary' : 'destructive'}>
                        {data.overallScore}%
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.metrics.map((metric, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            {getPerformanceStatusIcon(metric.status)}
                            <div>
                              <div className="font-medium">{metric.name}</div>
                              {metric.recommendation && (
                                <div className="text-sm text-blue-600">
                                  💡 {metric.recommendation}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-medium">
                              {metric.value} {metric.unit}
                            </div>
                            <Badge 
                              variant={metric.status === 'good' ? 'default' : metric.status === 'critical' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {metric.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <Zap className="h-12 w-12 mx-auto text-gray-600 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Performance Audit Data</h3>
                <p className="text-gray-600 mb-4">
                  Run a performance audit to see detailed performance analysis results.
                </p>
                <Button onClick={runPerformanceAudit} disabled={auditProgress.isRunning}>
                  <Zap className="h-4 w-4 mr-2" />
                  Run Performance Audit
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Report</CardTitle>
                <CardDescription>
                  Download detailed security audit report
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={downloadSecurityReport} 
                  disabled={!securityReport}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Security Report (.md)
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Report</CardTitle>
                <CardDescription>
                  Performance metrics and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  disabled={!performanceReport}
                  className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Performance Report (Coming Soon)
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations Summary */}
          {(securityReport || performanceReport) && (
            <Card>
              <CardHeader>
                <CardTitle>Recommendations Summary</CardTitle>
                <CardDescription>
                  Key recommendations for improving security and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {securityReport?.results
                    .filter(r => r.recommendation)
                    .map((result, index) => (
                      <div key={`sec-rec-${index}`} className="flex items-start gap-2 p-2 rounded bg-blue-50">
                        <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="text-sm">
                          <strong>Security:</strong> {result.recommendation}
                        </div>
                      </div>
                    ))}
                  
                  {performanceReport?.recommendations.map((rec, index) => (
                    <div key={`perf-rec-${index}`} className="flex items-start gap-2 p-2 rounded bg-green-50">
                      <Zap className="h-4 w-4 text-green-600 mt-0.5" />
                      <div className="text-sm">
                        <strong>Performance:</strong> {rec}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 