'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';
import { PageHeader } from '@/components/layout/page-header';

// Dynamically import swagger UI to avoid SSR window issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div className="flex flex-col h-full bg-white">
      <PageHeader
        title="API Documentation"
        description="Interactive OpenAPI specification for Senyx ERP"
      />
      
      <div className="flex-1 overflow-auto p-4">
        {/* Adds custom styles to integrate better with the red/white ERP theme */}
        <style jsx global>{`
          .swagger-ui .topbar { display: none; }
          .swagger-ui .info { margin: 20px 0; }
        `}</style>
        <SwaggerUI url="/api/docs" />
      </div>
    </div>
  );
}
