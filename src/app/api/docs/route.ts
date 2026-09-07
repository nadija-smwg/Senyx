import swaggerJsdoc from 'swagger-jsdoc';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/server/middleware/auth';
import { handleError } from '@/server/middleware/error-handler';
import { ForbiddenError } from '@/server/types/errors';

export async function GET(req: NextRequest) {
  try {
    const ctx = await withAuth(req);
    // Only Admins can view the API documentation
    if (!ctx.roles.includes('Admin')) {
      throw new ForbiddenError('API documentation is restricted to administrators.');
    }
  } catch (error) {
    return handleError(error);
  }

  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Senyx ERP API',
        version: '1.0.0',
        description: 'Internal API endpoints for Senyx ERP.',
      },
      servers: [
        {
          url: '/',
          description: 'Current Environment'
        },
      ],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'sb-access-token',
          },
        },
      },
      security: [
        {
          cookieAuth: [],
        },
      ],
    },
    apis: [
      // Match all route handlers in the API directory
      'src/app/api/**/*.ts',
    ],
  };

  const spec = swaggerJsdoc(options);
  return NextResponse.json(spec);
}
