import { redirect } from "next/navigation"

export default function RootPage() {
  // Temporarily redirect to HR module since it's our first built module
  redirect("/hr/employees")
}
