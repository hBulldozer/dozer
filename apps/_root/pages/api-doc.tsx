import { generateOpenAPIDocumentFromTRPCRouter } from 'openapi-trpc'
import { appRouter } from '@dozer/api'

// Generate the OpenAPI document from the tRPC router
const openApiDocument = generateOpenAPIDocumentFromTRPCRouter(appRouter, {
  pathPrefix: '/api/trpc',
})

// Define the page component that will render the API documentation
export default function ApiDoc() {
  return (
    <div className="container">
      <h1>API Documentation</h1>
      <p>This page serves the OpenAPI documentation for the Dozer API.</p>
      <p>The OpenAPI document is available at <a href="/api/openapi">/api/openapi</a></p>
      
      <div className="info-box">
        <h2>Using the API Documentation</h2>
        <p>You can view the interactive API documentation at <a href="/swagger">/swagger</a></p>
        <p>The OpenAPI specification can be imported into tools like Postman or Insomnia.</p>
      </div>
      
      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        h1 {
          font-size: 2rem;
          margin-bottom: 1rem;
        }
        .info-box {
          margin-top: 2rem;
          padding: 1rem;
          border: 1px solid #eaeaea;
          border-radius: 5px;
          background-color: #f9f9f9;
        }
        a {
          color: #0070f3;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}

// Export the document directly for use in other parts of the application
export const doc = openApiDocument
