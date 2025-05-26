import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import 'swagger-ui-react/swagger-ui.css'

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })

export default function SwaggerPage() {
  const [mounted, setMounted] = useState(false)
  
  // This ensures the component only renders on the client side
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="swagger-container">
      <div className="swagger-header">
        <h1>Dozer API Documentation</h1>
        <p>Explore and test the Dozer API using this interactive documentation.</p>
        <div className="links">
          <Link href="/api/openapi" legacyBehavior>
            <a className="button" target="_blank" rel="noopener noreferrer">Download OpenAPI Spec</a>
          </Link>
          <Link href="/api-doc" legacyBehavior>
            <a className="button secondary">API Overview</a>
          </Link>
        </div>
      </div>
      
      {mounted ? (
        <div className="swagger-ui-wrapper">
          <SwaggerUI
            url="/api/openapi"
            docExpansion="list"
            defaultModelsExpandDepth={1}
            deepLinking
          />
        </div>
      ) : (
        <div className="loading">Loading API documentation...</div>
      )}
      
      <style jsx>{`
        .swagger-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        .swagger-header {
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eaeaea;
        }
        h1 {
          font-size: 2rem;
          margin-bottom: 10px;
        }
        p {
          color: #666;
          font-size: 1.1rem;
          margin-bottom: 15px;
        }
        .links {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }
        .button {
          display: inline-block;
          padding: 8px 16px;
          background-color: #0070f3;
          color: white;
          border-radius: 4px;
          text-decoration: none;
          font-weight: 500;
        }
        .button.secondary {
          background-color: #f3f3f3;
          color: #333;
        }
        .loading {
          padding: 40px;
          text-align: center;
          font-size: 1.2rem;
          color: #666;
        }
        .swagger-ui-wrapper {
          margin-top: 20px;
          padding: 20px;
          border: 1px solid #eaeaea;
          border-radius: 8px;
          background-color: white;
        }
        /* Global styles to improve Swagger UI appearance */
        :global(.swagger-ui .info) {
          margin: 20px 0;
        }
        :global(.swagger-ui .scheme-container) {
          margin: 0 0 20px;
          padding: 15px;
          box-shadow: none;
          border: 1px solid #eaeaea;
        }
        :global(.swagger-ui .opblock) {
          margin-bottom: 15px;
          border-radius: 6px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        :global(.swagger-ui .opblock-tag) {
          font-size: 1.2rem;
          padding: 10px 0;
        }
      `}</style>
    </div>
  )
}
