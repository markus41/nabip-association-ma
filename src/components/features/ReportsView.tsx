import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ChartBar,
  FileText,
  Download,
  Plus,
  Play,
  CalendarBlank,
  MagnifyingGlass,
  Clock,
  ChartLine,
  ChartPie,
  Eye
} from '@phosphor-icons/react'
import type { Report } from '@/lib/types'
import { formatDate } from '@/lib/data-utils'
import { toast } from 'sonner'
import { ReportBuilder } from './ReportBuilder'
import {
  CustomLineChart,
  CustomBarChart,
  CustomAreaChart,
  CustomPieChart,
} from './ChartComponents'

interface ReportsViewProps {
  reports: Report[]
  loading?: boolean
}

export function ReportsView({ reports, loading }: ReportsViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [localReports, setLocalReports] = useState(reports)
  const [reportData, setReportData] = useState<any[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'preview'>('details')

  const filteredReports = useMemo(() => {
    return localReports.filter(report => {
      const matchesSearch =
        report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = categoryFilter === 'all' || report.category === categoryFilter

      return matchesSearch && matchesCategory
    }).sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
  }, [localReports, searchQuery, categoryFilter])

  const handleSaveReport = (report: Report) => {
    setLocalReports([...localReports, report])
  }

  const generateReportData = (report: Report, rowCount: number = 50) => {
    const data: any[] = []
    
    if (!report.columns || report.columns.length === 0) {
      return data
    }

    for (let i = 0; i < rowCount; i++) {
      const row: any = { id: i + 1 }
      
      report.columns.forEach(column => {
        switch (column.type) {
          case 'string':
            if (column.field.includes('name') || column.field.includes('Name')) {
              const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda']
              const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis']
              row[column.field] = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`
            } else if (column.field.includes('email') || column.field.includes('Email')) {
              row[column.field] = `user${i + 1}@example.com`
            } else if (column.field.includes('status') || column.field.includes('Status')) {
              row[column.field] = ['Active', 'Pending', 'Completed'][Math.floor(Math.random() * 3)]
            } else if (column.field.includes('type') || column.field.includes('Type')) {
              row[column.field] = ['Individual', 'Organizational', 'Student'][Math.floor(Math.random() * 3)]
            } else if (column.field.includes('chapter') || column.field.includes('Chapter')) {
              row[column.field] = ['California', 'Texas', 'Florida', 'New York'][Math.floor(Math.random() * 4)]
            } else {
              row[column.field] = `Sample ${column.label}`
            }
            break
          
          case 'number':
            if (column.field.includes('amount') || column.field.includes('revenue') || column.field.includes('price')) {
              row[column.field] = Math.floor(Math.random() * 10000) + 1000
            } else if (column.field.includes('count') || column.field.includes('Count')) {
              row[column.field] = Math.floor(Math.random() * 100) + 1
            } else if (column.field.includes('score') || column.field.includes('Score')) {
              row[column.field] = Math.floor(Math.random() * 100)
            } else {
              row[column.field] = Math.floor(Math.random() * 1000)
            }
            break
          
          case 'date':
            const randomDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
            row[column.field] = randomDate.toLocaleDateString()
            break
          
          default:
            row[column.field] = `Data ${i + 1}`
        }
      })
      
      data.push(row)
    }
    
    return data
  }

  const handleRunReport = async (report: Report) => {
    setIsRunning(true)
    
    toast.info(`Running report: ${report.name}`, {
      description: 'Generating report data...'
    })

    // Simulate report generation delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    try {
      // Generate actual report data
      const data = generateReportData(report, 50)
      setReportData(data)

      // Update the report's last run date
      const updatedReports = localReports.map(r => 
        r.id === report.id 
          ? { ...r, lastRunDate: new Date().toISOString() }
          : r
      )
      setLocalReports(updatedReports)

      // Update selected report
      if (selectedReport?.id === report.id) {
        setSelectedReport({ ...report, lastRunDate: new Date().toISOString() })
      }

      // Switch to preview tab to show results
      setActiveTab('preview')

      toast.success(`Report completed: ${report.name}`, {
        description: `Generated ${data.length} rows of data.`
      })
    } catch (error) {
      toast.error('Failed to run report', {
        description: 'An error occurred while generating the report.'
      })
    } finally {
      setIsRunning(false)
    }
  }

  const handleExportReport = (report: Report, format: string) => {
    toast.success(`Exporting to ${format.toUpperCase()}`, {
      description: 'Your download will start shortly.'
    })
  }

  const categories = ['membership', 'financial', 'events', 'engagement', 'custom']

  const memberGrowthData = [
    { month: 'Jan', members: 18500, newMembers: 250, renewals: 1200 },
    { month: 'Feb', members: 18750, newMembers: 300, renewals: 1100 },
    { month: 'Mar', members: 19100, newMembers: 450, renewals: 1350 },
    { month: 'Apr', members: 19400, newMembers: 350, renewals: 1150 },
    { month: 'May', members: 19800, newMembers: 420, renewals: 1280 },
    { month: 'Jun', members: 20150, newMembers: 380, renewals: 1220 },
  ]

  const revenueData = [
    { month: 'Jan', dues: 245000, events: 68000, donations: 12000 },
    { month: 'Feb', dues: 258000, events: 52000, donations: 15000 },
    { month: 'Mar', dues: 272000, events: 94000, donations: 18000 },
    { month: 'Apr', dues: 265000, events: 71000, donations: 14000 },
    { month: 'May', dues: 281000, events: 88000, donations: 22000 },
    { month: 'Jun', dues: 295000, events: 105000, donations: 19000 },
  ]

  const membershipTypeData = [
    { type: 'Individual', count: 12500 },
    { type: 'Organizational', count: 5800 },
    { type: 'Student', count: 1200 },
    { type: 'Lifetime', count: 650 },
  ]

  const engagementData = [
    { month: 'Jan', events: 45, emailOpens: 68, webVisits: 82 },
    { month: 'Feb', events: 52, emailOpens: 71, webVisits: 79 },
    { month: 'Mar', events: 68, emailOpens: 78, webVisits: 88 },
    { month: 'Apr', events: 58, emailOpens: 75, webVisits: 85 },
    { month: 'May', events: 71, emailOpens: 82, webVisits: 91 },
    { month: 'Jun', events: 65, emailOpens: 79, webVisits: 87 },
  ]

  const chapterRevenueData = [
    { chapter: 'California', revenue: 425000 },
    { chapter: 'Texas', revenue: 385000 },
    { chapter: 'Florida', revenue: 340000 },
    { chapter: 'New York', revenue: 315000 },
    { chapter: 'Illinois', revenue: 285000 },
    { chapter: 'Ohio', revenue: 265000 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Generate insights and export data
          </p>
        </div>
        <Button onClick={() => setBuilderOpen(true)}>
          <Plus className="mr-2" size={18} weight="bold" />
          Create Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText size={20} weight="duotone" className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                Total Reports
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {loading ? '...' : localReports.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center">
              <CalendarBlank size={20} weight="duotone" className="text-teal" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                Scheduled
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {loading ? '...' : localReports.filter(r => r.schedule).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Clock size={20} weight="duotone" className="text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                Run Today
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {loading ? '...' : localReports.filter(r => {
                  if (!r.lastRunDate) return false
                  const lastRun = new Date(r.lastRunDate)
                  const today = new Date()
                  return lastRun.toDateString() === today.toDateString()
                }).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <ChartBar size={20} weight="duotone" className="text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                Public Reports
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {loading ? '...' : localReports.filter(r => r.isPublic).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="visualizations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="visualizations" className="gap-2">
            <ChartLine size={16} />
            Visualizations
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <FileText size={16} />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visualizations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CustomLineChart
              data={memberGrowthData}
              lines={[
                { dataKey: 'members', name: 'Total Members', color: 'oklch(0.25 0.05 250)' },
                { dataKey: 'newMembers', name: 'New Members', color: 'oklch(0.60 0.12 200)' },
                { dataKey: 'renewals', name: 'Renewals', color: 'oklch(0.75 0.15 85)' },
              ]}
              xAxisKey="month"
              title="Member Growth Trend"
              description="Track membership growth and renewal patterns over time"
              loading={loading}
            />

            <CustomAreaChart
              data={revenueData}
              areas={[
                { dataKey: 'dues', name: 'Membership Dues', color: 'oklch(0.25 0.05 250)' },
                { dataKey: 'events', name: 'Event Revenue', color: 'oklch(0.60 0.12 200)' },
                { dataKey: 'donations', name: 'Donations', color: 'oklch(0.75 0.15 85)' },
              ]}
              xAxisKey="month"
              title="Revenue by Source"
              description="Revenue breakdown across different income streams"
              stacked
              loading={loading}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CustomPieChart
              data={membershipTypeData}
              dataKey="count"
              nameKey="type"
              title="Membership Distribution"
              description="Current member breakdown by membership type"
              loading={loading}
            />

            <CustomBarChart
              data={chapterRevenueData}
              bars={[
                { dataKey: 'revenue', name: 'Revenue', color: 'oklch(0.25 0.05 250)' },
              ]}
              xAxisKey="chapter"
              title="Top Chapters by Revenue"
              description="Highest performing chapters by revenue generation"
              loading={loading}
            />
          </div>

          <CustomLineChart
            data={engagementData}
            lines={[
              { dataKey: 'events', name: 'Event Attendance %', color: 'oklch(0.25 0.05 250)' },
              { dataKey: 'emailOpens', name: 'Email Open Rate %', color: 'oklch(0.60 0.12 200)' },
              { dataKey: 'webVisits', name: 'Website Engagement %', color: 'oklch(0.75 0.15 85)' },
            ]}
            xAxisKey="month"
            title="Member Engagement Metrics"
            description="Track member participation across different touchpoints"
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlass
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <Input
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-muted animate-shimmer rounded w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <FileText size={48} className="mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No reports found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((report) => (
                    <TableRow
                      key={report.id}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedReport(report)
                        setActiveTab('details')
                        setReportData([])
                      }}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{report.name}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {report.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {report.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {report.schedule ? (
                          <div className="flex items-center gap-1 text-sm">
                            <CalendarBlank size={14} className="text-muted-foreground" />
                            <span className="capitalize">{report.schedule.frequency}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">On-demand</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {report.lastRunDate ? formatDate(report.lastRunDate) : 'Never'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {report.isPublic ? (
                          <Badge variant="outline" className="bg-teal/10 text-teal border-teal/20">
                            Public
                          </Badge>
                        ) : (
                          <Badge variant="outline">Private</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRunReport(report)
                          }}
                        >
                          <Play size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedReport} onOpenChange={(open) => {
        if (!open) {
          setSelectedReport(null)
          setActiveTab('details')
          setReportData([])
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedReport?.name}</DialogTitle>
            <DialogDescription>Report details and configuration</DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'details' | 'preview')} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="shrink-0">
                <TabsTrigger value="details" className="gap-2">
                  <FileText size={16} />
                  Details
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-2">
                  <Eye size={16} />
                  Web View
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="flex-1 overflow-y-auto pr-2 mt-4">
                <div className="space-y-6">
                  <div>
                    <Badge variant="outline" className="capitalize mb-3">
                      {selectedReport.category}
                    </Badge>
                    <p className="text-muted-foreground">{selectedReport.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Created By
                      </p>
                      <p className="font-medium">{selectedReport.createdBy}</p>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Created Date
                      </p>
                      <p className="font-medium">{formatDate(selectedReport.createdDate)}</p>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Last Run
                      </p>
                      <p className="font-medium">
                        {selectedReport.lastRunDate
                          ? formatDate(selectedReport.lastRunDate)
                          : 'Never'}
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Visibility
                      </p>
                      <p className="font-medium">{selectedReport.isPublic ? 'Public' : 'Private'}</p>
                    </div>
                  </div>

                  {selectedReport.schedule && (
                    <div className="p-4 rounded-lg border">
                      <h4 className="font-semibold mb-3">Schedule Configuration</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Frequency</span>
                          <span className="font-medium capitalize">
                            {selectedReport.schedule.frequency}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Time</span>
                          <span className="font-medium">{selectedReport.schedule.time}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Recipients</span>
                          <span className="font-medium">
                            {selectedReport.schedule.recipients.length} users
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedReport.columns && selectedReport.columns.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Report Columns</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedReport.columns.map((column, idx) => (
                          <div
                            key={idx}
                            className="text-sm p-2 rounded bg-muted/30 flex items-center justify-between"
                          >
                            <span>{column.label}</span>
                            <Badge variant="outline" className="text-xs">
                              {column.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="preview" className="flex-1 overflow-y-auto pr-2 mt-4">
                <div className="space-y-4">
                  <div className="rounded-lg border bg-card p-6">
                    <div className="mb-6">
                      <h2 className="text-2xl font-semibold mb-2">{selectedReport.name}</h2>
                      <p className="text-muted-foreground">{selectedReport.description}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="outline" className="capitalize">
                          {selectedReport.category}
                        </Badge>
                        {selectedReport.isPublic && (
                          <Badge variant="outline" className="bg-teal/10 text-teal border-teal/20">
                            Public
                          </Badge>
                        )}
                      </div>
                    </div>

                    {reportData.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            Showing {reportData.length} rows
                          </p>
                          <Badge variant="outline" className="bg-teal/10 text-teal border-teal/20">
                            Last run: {selectedReport.lastRunDate ? formatDate(selectedReport.lastRunDate) : 'Just now'}
                          </Badge>
                        </div>
                        <div className="max-h-[400px] overflow-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>ID</TableHead>
                                {selectedReport.columns?.map((col, idx) => (
                                  <TableHead key={idx}>{col.label}</TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {reportData.slice(0, 50).map((row, rowIdx) => (
                                <TableRow key={rowIdx}>
                                  <TableCell className="font-medium">#{row.id}</TableCell>
                                  {selectedReport.columns?.map((col, colIdx) => (
                                    <TableCell key={colIdx}>
                                      {col.type === 'number' && typeof row[col.field] === 'number'
                                        ? row[col.field].toLocaleString()
                                        : row[col.field]}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <ChartBar size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                        <p className="text-muted-foreground text-lg font-medium mb-2">
                          No data generated yet
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Click "Run Report" below to generate the report with actual data
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <div className="flex flex-wrap gap-2 pt-4 border-t shrink-0 mt-4">
                <Button 
                  className="flex-1 min-w-[140px]" 
                  onClick={() => handleRunReport(selectedReport)}
                  disabled={isRunning}
                >
                  {isRunning ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-background border-t-transparent rounded-full" />
                      <span className="ml-2">Running...</span>
                    </>
                  ) : (
                    <>
                      <Play size={18} weight="bold" />
                      <span className="ml-2">Run Report</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 min-w-[100px]"
                  onClick={() => handleExportReport(selectedReport, 'csv')}
                  disabled={isRunning || reportData.length === 0}
                >
                  <Download size={18} />
                  <span className="ml-2">CSV</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 min-w-[100px]"
                  onClick={() => handleExportReport(selectedReport, 'excel')}
                  disabled={isRunning || reportData.length === 0}
                >
                  <Download size={18} />
                  <span className="ml-2">Excel</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 min-w-[100px]"
                  onClick={() => handleExportReport(selectedReport, 'pdf')}
                  disabled={isRunning || reportData.length === 0}
                >
                  <Download size={18} />
                  <span className="ml-2">PDF</span>
                </Button>
              </div>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <ReportBuilder
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        onSave={handleSaveReport}
      />
    </div>
  )
}
