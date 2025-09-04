import { Layout } from '../../components/Layout'
import { Button, Widget, Typography } from '@dozer/ui'
import Link from 'next/link'

const DevIndexPage = () => {
  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return (
      <Layout>
        <div className="flex flex-col justify-center items-center min-h-[80vh] max-w-2xl mx-auto">
          <Widget id="dev-only" maxWidth={600}>
            <Widget.Content>
              <div className="p-6 text-center">
                <Typography variant="h2" className="mb-4 text-red-400">
                  🚫 Development Only
                </Typography>
                <Typography variant="lg" className="text-gray-400">
                  This debug section is only available in development mode.
                </Typography>
              </div>
            </Widget.Content>
          </Widget>
        </div>
      </Layout>
    )
  }

  const debugPages = [
    {
      name: 'Route Testing',
      description: 'Test route logging and analysis functionality',
      path: '/dev/test-routes',
      icon: '🧪',
    },
    {
      name: 'SQL Queries',
      description: 'View raw SQL query results for debugging',
      path: '/dev/sql',
      icon: '🗄️',
    },
    {
      name: 'WebSocket Events',
      description: 'Monitor real-time blockchain events',
      path: '/dev/websocket',
      icon: '🔌',
    },
    {
      name: 'Toast Notifications',
      description: 'Test different types of toast notifications',
      path: '/dev/notificationToast',
      icon: '🍞',
    },
    {
      name: 'Routing Debug',
      description: 'Comprehensive route testing for all token combinations',
      path: '/dev/routing',
      icon: '🛣️',
    },
  ]

  return (
    <Layout>
      <div className="flex flex-col justify-center items-center min-h-[80vh] max-w-4xl mx-auto">
        <Widget id="dev-index" maxWidth={800}>
          <Widget.Content>
            <div className="p-6">
              <Typography variant="h2" className="mb-2 text-center">
                🛠️ Development Tools
              </Typography>
              <Typography variant="sm" className="mb-6 text-center text-gray-400">
                Debug pages and testing utilities for development
              </Typography>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {debugPages.map((page) => (
                  <Link key={page.path} href={page.path}>
                    <div className="p-4 border border-gray-700 rounded-lg hover:border-blue-500 hover:bg-gray-800/50 transition-colors cursor-pointer">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{page.icon}</span>
                        <div className="flex-1">
                          <Typography variant="lg" className="mb-1 font-medium">
                            {page.name}
                          </Typography>
                          <Typography variant="sm" className="text-gray-400">
                            {page.description}
                          </Typography>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                <Typography variant="sm" className="text-yellow-200">
                  <strong>⚠️ Development Only:</strong> These pages are only available when running in development mode
                  (NODE_ENV=development).
                </Typography>
              </div>
            </div>
          </Widget.Content>
        </Widget>
      </div>
    </Layout>
  )
}

export default DevIndexPage
