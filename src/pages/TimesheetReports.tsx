import { TimesheetReports } from "@/components/timesheet-management/TimesheetReports";

export default function TimesheetReportsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Timesheet Reports</h1>
          <p className="text-muted-foreground">
            Generate detailed timesheet compliance and productivity reports
          </p>
        </div>
      </div>

      <TimesheetReports />
    </div>
  );
}