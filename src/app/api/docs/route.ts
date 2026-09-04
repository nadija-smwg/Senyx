import swaggerJsdoc from 'swagger-jsdoc';
import { NextResponse } from 'next/server';

export async function GET() {
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
