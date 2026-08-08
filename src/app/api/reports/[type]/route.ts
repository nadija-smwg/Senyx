import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { generateReportData, exportReportToCSV, exportReportToPDF, ReportType, ReportFilter } from '@/server/services/report.service';

export async function GET(req: NextRequest, props: { params: Promise<{ type: string }> }) {
  try {
    const params = await props.params;
    const ctx = await withAuth(req);
    
    const format = req.nextUrl.searchParams.get('format') || 'json';
    const type = params.type as ReportType;

    const filters: ReportFilter = {
      startDate: req.nextUrl.searchParams.get('startDate') || undefined,
      endDate: req.nextUrl.searchParams.get('endDate') || undefined,
      projectId: req.nextUrl.searchParams.get('projectId') || undefined,
      employeeId: req.nextUrl.searchParams.get('employeeId') || undefined,
    };

    const data = await generateReportData(ctx, type, filters);

    if (format === 'csv') {
      const csv = await exportReportToCSV(data);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${type}-report.csv"`
        }
      });
    }

    if (format === 'pdf') {
      const pdfBuffer = await exportReportToPDF(type, data);
      return new NextResponse(pdfBuffer as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${type}-report.pdf"`
        }
      });
    }

    // Default JSON
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}
