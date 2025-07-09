import { useState } from 'react'
import { Layout } from '../components/Layout'
import { Button, Widget, Typography } from '@dozer/ui'
import { api } from 'utils/api'

const TestRoutesPage = () => {
  const [testResult, setTestResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const utils = api.useUtils()

  const handleTestRouteLogging = async () => {
    setIsLoading(true)
    try {
      const result = await utils.getPools.testRouteLogging.fetch({})
      setTestResult(result)
      console.log('🧪 Test Route Logging Result:', result)
    } catch (error) {
      console.error('❌ Test failed:', error)
      setTestResult({ success: false, message: `Error: ${error}` })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnalyzeRoute = async () => {
    setIsLoading(true)
    try {
      // Test with HTR → some other token
      const result = await utils.getPools.analyzeRoute.fetch({
        tokenIn: '00', // HTR
        amountIn: 100,
        tokenOut: '', // Will auto-detect if empty
      })
      setTestResult(result)
      console.log('🔬 Route Analysis Result:', result)
    } catch (error) {
      console.error('❌ Analysis failed:', error)
      setTestResult({ success: false, message: `Error: ${error}` })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Layout>
      <div className="flex flex-col justify-center items-center min-h-[80vh] max-w-2xl mx-auto">
        <Widget id="test-routes" maxWidth={600}>
          <Widget.Content>
            <div className="p-6">
              <Typography variant="h2" className="mb-6 text-center">
                🧪 Route Logging Test
              </Typography>

              <div className="space-y-4">
                <div>
                  <Typography variant="lg" className="mb-2">
                    Test Basic Route Logging
                  </Typography>
                  <Typography variant="sm" className="mb-4 text-gray-400">
                    This will test the route logging system with default parameters and log details to the server
                    console.
                  </Typography>
                  <Button onClick={handleTestRouteLogging} disabled={isLoading} className="w-full">
                    {isLoading ? 'Testing...' : 'Test Route Logging'}
                  </Button>
                </div>

                <div>
                  <Typography variant="lg" className="mb-2">
                    Test Route Analysis
                  </Typography>
                  <Typography variant="sm" className="mb-4 text-gray-400">
                    This will run a detailed route analysis and show hop-by-hop information.
                  </Typography>
                  <Button onClick={handleAnalyzeRoute} disabled={isLoading} variant="outlined" className="w-full">
                    {isLoading ? 'Analyzing...' : 'Analyze Route'}
                  </Button>
                </div>
              </div>

              {testResult && (
                <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                  <Typography variant="lg" className="mb-2">
                    Result:
                  </Typography>
                  <pre className="text-xs overflow-auto">{JSON.stringify(testResult, null, 2)}</pre>
                </div>
              )}

              <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                <Typography variant="sm" className="text-blue-200">
                  <strong>📝 Note:</strong> The detailed route information will be logged to the server console. Check
                  your terminal/server logs to see the route paths, amounts, and price impact details.
                </Typography>
              </div>

              <div className="mt-4 p-4 bg-green-900/20 border border-green-700 rounded-lg">
                <Typography variant="sm" className="text-green-200">
                  <strong>✅ What to expect in console:</strong>
                  <ul className="mt-2 ml-4 list-disc space-y-1">
                    <li>🔍 Route discovery logs</li>
                    <li>📍 Full swap path with token UUIDs</li>
                    <li>💰 Amount progression through each hop</li>
                    <li>📊 Price impact calculations</li>
                    <li>🏷️ Token symbols for readability</li>
                  </ul>
                </Typography>
              </div>
            </div>
          </Widget.Content>
        </Widget>
      </div>
    </Layout>
  )
}

export default TestRoutesPage
