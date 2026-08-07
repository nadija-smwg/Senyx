"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, Building, Mail, Phone, Briefcase, Calendar, CheckCircle2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function EmployeeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [employee, setEmployee] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showSensitive, setShowSensitive] = useState(false)

  useEffect(() => {
    async function fetchEmployee() {
      try {
        const res = await fetch(`/api/employees/${params.id}`)
        if (!res.ok) throw new Error("Failed to fetch")
        const json = await res.json()
        setEmployee(json.data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchEmployee()
  }, [params.id])

  if (loading) return <div className="p-10">Loading...</div>
  if (!employee) return <div className="p-10">Employee not found.</div>

  return (
    <div className="container mx-auto py-10 max-w-5xl space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/hr/employees">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {employee.firstName} {employee.lastName}
            </h1>
            <Badge variant={employee.status === "active" ? "default" : "secondary"}>
              {employee.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <p className="text-muted-foreground">{employee.employeeCode}</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills Matrix</TabsTrigger>
          <TabsTrigger value="leave">Leave & Time Off</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Professional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium w-24">Designation:</span>
                  <span>{employee.designationTitle || "N/A"}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium w-24">Department:</span>
                  <span>{employee.departmentName || "N/A"}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium w-24">Started:</span>
                  <span>{employee.startDate ? new Date(employee.startDate).toLocaleDateString() : "N/A"}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium w-24">Type:</span>
                  <span className="capitalize">{employee.employmentType?.replace('_', ' ')}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium w-24">Email:</span>
                  <a href={`mailto:${employee.email}`} className="text-blue-600 hover:underline">{employee.email}</a>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium w-24">Phone:</span>
                  <span>{employee.phone || "Not provided"}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Sensitive Information</CardTitle>
                  <CardDescription>Only visible to HR & Admins</CardDescription>
                </div>
                <Button variant="outline" size="icon" onClick={() => setShowSensitive(!showSensitive)}>
                  {showSensitive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Annual Salary</span>
                    <p className="text-lg font-mono">
                      {showSensitive ? (employee.salary ? `$${employee.salary}` : "Not set") : "••••••••"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">National ID / SSN</span>
                    <p className="text-lg font-mono">
                      {showSensitive ? (employee.nationalId || "Not set") : "••••••••"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle>Skills Matrix</CardTitle>
              <CardDescription>Verified competencies and proficiency levels.</CardDescription>
            </CardHeader>
            <CardContent>
              {employee.skills && employee.skills.length > 0 ? (
                <div className="space-y-4">
                  {employee.skills.map((skill: any) => (
                    <div key={skill.skillId} className="flex items-center justify-between border-b pb-4">
                      <div>
                        <p className="font-medium">{skill.skillName}</p>
                        <p className="text-sm text-muted-foreground">{skill.category}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`h-2 w-8 rounded-full ${
                                level <= skill.proficiency ? 'bg-primary' : 'bg-muted'
                              }`}
                            />
                          ))}
                        </div>
                        {skill.certified && <Badge variant="outline" className="border-green-500 text-green-600">Certified</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">No skills recorded.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="leave">
          <Card>
            <CardHeader>
              <CardTitle>Leave Balances</CardTitle>
            </CardHeader>
            <CardContent>
              {employee.leaveBalances && employee.leaveBalances.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {employee.leaveBalances.map((lb: any) => (
                    <div key={lb.id} className="p-4 border rounded-lg text-center">
                      <p className="text-3xl font-bold">{lb.balanceDays}</p>
                      <p className="text-sm text-muted-foreground">{lb.leaveTypeName}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">No active leave balances.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll">
          <Card>
            <CardHeader>
              <CardTitle>Payroll History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10 text-muted-foreground">Payroll integration coming in Phase 4.</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
