import React, { useState } from 'react'
import { Container, Typography, Select } from '@dozer/ui'
import { api } from '../utils/api'
import { Layout } from '../components/Layout'
import PriceChart from '../../swap/components/TokenPage/PriceChart'

const PriceTestNewPage: React.FC = () => {
  const [selectedToken, setSelectedToken] = useState<string>('00') // Default to HTR token

  // Get token info to map UUIDs to symbols
  const { data: tokenInfo, isLoading: loadingTokenInfo } = api.getNewPrices.tokenInfo.useQuery()

  return (
    <Layout>
      <Container className="py-8">
        <div className="flex flex-col space-y-8">
          <div className="flex items-center justify-between">
            <Typography variant="h1">New Price Chart Component</Typography>
          </div>

          {/* Token selector */}
          <div className="w-full max-w-md">
            <Typography variant="sm" className="mb-1">
              Select Token
            </Typography>
            <Select
              value={selectedToken}
              onChange={(value) => setSelectedToken(value)}
              className="w-full"
              button={
                <Select.Button>
                  {!loadingTokenInfo && tokenInfo && tokenInfo[selectedToken]
                    ? `${tokenInfo[selectedToken].symbol || selectedToken}`
                    : selectedToken === '00'
                    ? 'HTR'
                    : selectedToken}
                </Select.Button>
              }
            >
              <Select.Options>
                {!loadingTokenInfo &&
                  tokenInfo &&
                  Object.entries(tokenInfo).map(([uuid, data]) => (
                    <Select.Option key={uuid} value={uuid}>
                      {data.symbol || uuid} {data.name ? `(${data.name})` : ''}
                    </Select.Option>
                  ))}
                {(loadingTokenInfo || !tokenInfo) && <Select.Option value="00">HTR</Select.Option>}
              </Select.Options>
            </Select>
          </div>

          {/* Price chart component */}
          <div className="p-6 rounded-lg bg-stone-800">
            <PriceChart
              tokenId={selectedToken}
              showControls={true}
              showCurrencyToggle={true}
              initialChartType="line"
              initialTimeRange="24H"
              initialCurrency="USD"
              height={500}
              onPriceChange={(price, change) => {
                console.log('Price changed:', { price, change })
              }}
            />
          </div>
        </div>
      </Container>
    </Layout>
  )
}

export default PriceTestNewPage
