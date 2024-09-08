import React, { useState, useEffect } from 'react'
import {
  Form,
  Input,
  Button,
  Typography,
  Container,
  Tab,
  createSuccessToast,
  NotificationData,
  BreadcrumbLink,
  Dialog,
  createFailedToast,
} from '@dozer/ui'
import TextAreaInput from '../components/TextAreaInput'
import { PhotoIcon } from '@heroicons/react/24/outline'
import { Checker, useJsonRpc, useWalletConnectClient } from '@dozer/higmi'
import { UploadDropzone } from '@dozer/api'
import { api } from '../utils/api'
import { useNetwork, useAccount } from '@dozer/zustand'
import { get, set } from 'lodash'
import { Layout } from '../components/Layout'
import { CustomToken } from '@dozer/nanocontracts'

const TokenCreationPage: React.FC = () => {
  const [tokenName, setTokenName] = useState('')
  const [tokenSymbol, setTokenSymbol] = useState('')
  const [tokenDescription, setTokenDescription] = useState('')
  const [telegram, setTelegram] = useState('')
  const [twitter, setTwitter] = useState('')
  const [website, setWebsite] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File>()
  const [imageSource, setImageSource] = useState<'upload' | 'generate'>('upload')
  const [generatedMeme, setGeneratedMeme] = useState<string | null>(null)
  const [isGeneratingMeme, setIsGeneratingMeme] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [totalSupply, setTotalSupply] = useState('')
  const [userHtrBalance, setUserHtrBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const [tokenNameError, setTokenNameError] = useState('')
  const [tokenSymbolError, setTokenSymbolError] = useState('')
  const [telegramError, setTelegramError] = useState('')
  const [twitterError, setTwitterError] = useState('')
  const [websiteError, setWebsiteError] = useState('')

  const { accounts } = useWalletConnectClient()
  const address = accounts.length > 0 ? accounts[0].split(':')[2] : ''
  const { network } = useNetwork()
  const { balance } = useAccount()

  const { hathorRpc, rpcResult, isRpcRequestPending, reset } = useJsonRpc()

  useEffect(() => {
    const htrBalance = balance.find((b) => b.token_symbol === 'HTR')?.token_balance || 0
    setUserHtrBalance(htrBalance)
  }, [balance])

  const LINKS = (): BreadcrumbLink[] => [
    {
      href: `/pool/create`,
      label: `Create Token`,
    },
  ]

  const validateTokenName = (value: string) => {
    if (!/^[a-zA-Z0-9 ]{0,30}$/.test(value)) {
      setTokenNameError('Alphanumeric characters and spaces only (max 30 characters)')
    } else {
      setTokenNameError('')
    }
  }

  const validateTokenSymbol = (value: string) => {
    if (!/^[a-zA-Z0-9]{2,5}$/.test(value)) {
      setTokenSymbolError('Alphanumeric characters only (min 2 characters, max 5 characters)')
    } else {
      setTokenSymbolError('')
    }
  }

  const validateTelegram = (value: string) => {
    if (value && !/^[a-zA-Z0-9_]{5,32}$/.test(value)) {
      setTelegramError('Alphanumeric characters and underscores only (min 5, max 32)')
    } else {
      setTelegramError('')
    }
  }

  const validateTwitter = (value: string) => {
    if (value && !/^[a-zA-Z0-9_]{1,15}$/.test(value)) {
      setTwitterError('Invalid Twitter username')
    } else {
      setTwitterError('')
    }
  }

  const validateWebsite = (value: string) => {
    if (value && !/^(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+$/.test(value)) {
      setWebsiteError('Invalid website URL')
    } else {
      setWebsiteError('')
    }
  }

  const handleTokenNameChange = (value: string) => {
    setTokenName(value)
    validateTokenName(value)
  }

  const handleTokenSymbolChange = (value: string) => {
    setTokenSymbol(value)
    validateTokenSymbol(value)
  }

  const handleTelegramChange = (value: string) => {
    setTelegram(value)
    validateTelegram(value)
  }

  const handleTwitterChange = (value: string) => {
    setTwitter(value)
    validateTwitter(value)
  }

  const handleWebsiteChange = (value: string) => {
    setWebsite(value)
    validateWebsite(value)
  }

  const resetFields = () => {
    setTokenName('')
    setTokenSymbol('')
    setTokenDescription('')
    setTelegram('')
    setTwitter('')
    setWebsite('')
    setImageUrl('')
    setUploadError('')
    setUploadedFile(undefined)
    setImageSource('upload')
    setGeneratedMeme(null)
    setIsGeneratingMeme(false)
    setTotalSupply('')
  }

  const mutation = api.getTokens.createCustom.useMutation({
    onSuccess: (data) => {
      const notificationData: NotificationData = {
        type: 'swap',
        chainId: network,
        summary: {
          pending: `Confirming token ${tokenSymbol} creation...`,
          completed: `Success! Token ${tokenSymbol} created!`,
          failed: 'Token creation failed',
          info: `Creating Token ${tokenSymbol}.`,
        },
        status: 'completed',
        txHash: data.hash,
        groupTimestamp: Math.floor(Date.now() / 1000),
        timestamp: Math.floor(Date.now() / 1000),
        promise: Promise.resolve(),
        account: address,
      }
      setIsLoading(false)
      createSuccessToast(notificationData)
      resetFields()
    },
    onError: (error) => {
      console.error('Error creating token:', error)
      const errorNotification: NotificationData = {
        type: 'swap',
        chainId: network,
        summary: {
          pending: `Creating token ${tokenSymbol}...`,
          completed: `Token ${tokenSymbol} creation failed`,
          failed: `Failed to create token ${tokenSymbol}`,
          info: `Error creating Token ${tokenSymbol}.`,
        },
        status: 'failed',
        txHash: '',
        groupTimestamp: Math.floor(Date.now() / 1000),
        timestamp: Math.floor(Date.now() / 1000),
        promise: Promise.reject(error),
        account: address,
      }
      setIsLoading(false)
      createFailedToast(errorNotification)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    setIsLoading(true)
    if (tokenNameError || tokenSymbolError || telegramError || twitterError || websiteError) {
      const errorNotification: NotificationData = {
        type: 'swap',
        chainId: network,
        summary: {
          pending: `Creating token ${tokenSymbol}...`,
          completed: `Token ${tokenSymbol} creation failed`,
          failed: `Inputs are invalid.`,
          info: `Error creating Token ${tokenSymbol}.`,
        },
        status: 'failed',
        txHash: '',
        groupTimestamp: Math.floor(Date.now() / 1000),
        timestamp: Math.floor(Date.now() / 1000),
        promise: Promise.resolve(),
        account: address,
      }
      createFailedToast(errorNotification)
      setIsLoading(false)
      return
    }

    e.preventDefault()
    console.log({
      tokenName,
      tokenSymbol,
      tokenDescription,
      telegram,
      twitter,
      website,
      imageUrl: imageSource === 'upload' ? imageUrl : generatedMeme,
      totalSupply,
    })

    mutation.mutate({
      name: tokenName,
      symbol: tokenSymbol,
      chainId: network,
      decimals: 2,
      description: tokenDescription,
      imageUrl: imageSource === 'upload' ? imageUrl : generatedMeme || '',
      telegram,
      twitter,
      website,
      createdBy: address,
      totalSupply: parseInt(totalSupply),
    })
  }

  const generateMeme = async () => {
    setIsGeneratingMeme(true)
    try {
      const response = await fetch('https://meme-api.com/gimme/bitcoinmemes')
      const data = await response.json()
      setGeneratedMeme(data.url)
    } catch (error) {
      console.error('Failed to generate meme:', error)
      setUploadError('Failed to generate meme. Please try again.')
    } finally {
      setIsGeneratingMeme(false)
    }
  }

  const requiredHtr = (parseInt(totalSupply) || 0) * 0.01
  const isEnoughBalance = userHtrBalance / 100 >= requiredHtr

  return (
    <Layout breadcrumbs={LINKS()}>
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Container className="flex items-center justify-center">
          <div className="max-w-4xl p-8 sm:w-full md:w-max w-max bg-stone-800 rounded-xl">
            <Form header="" className="-mt-12" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-12 md:flex-row md:items-center">
                <div className="md:w-1/3">
                  <Form.Control label="Token Image">
                    <Tab.Group>
                      <Tab.List>
                        <Tab className="py-7" onClick={() => setImageSource('upload')}>
                          Upload Image
                        </Tab>
                        <Tab className="py-7" onClick={() => setImageSource('generate')}>
                          Generate Meme
                        </Tab>
                      </Tab.List>
                      <Tab.Panels>
                        <Tab.Panel>
                          <UploadDropzone
                            content={{
                              uploadIcon({ ready }) {
                                if (uploadedFile)
                                  return (
                                    <div className="mt-2">
                                      <img
                                        src={URL.createObjectURL(uploadedFile)}
                                        alt="Uploaded token image"
                                        className={
                                          !imageUrl ? 'object-cover w-20 h-20 opacity-40' : 'object-cover w-20 h-20'
                                        }
                                      />
                                    </div>
                                  )
                                return <PhotoIcon className="w-20 h-20 mx-auto text-stone-500" />
                              },
                              button({ ready, isUploading, uploadProgress }) {
                                if (!uploadedFile || imageUrl) return ''
                                if (isUploading)
                                  return (
                                    <Button className="mt-2 cursor-default" variant="outlined" size="xs" disabled>
                                      Uploading... {uploadProgress}%
                                    </Button>
                                  )
                                if (uploadedFile)
                                  return (
                                    <Button className="mx-1 mt-2 mb-1" variant="outlined" size="xs">
                                      Upload
                                    </Button>
                                  )
                              },
                              allowedContent({ ready, fileTypes, isUploading }) {
                                if (ready && !isUploading && !imageUrl && !uploadedFile)
                                  return (
                                    <div className="flex flex-col gap-2 mt-4">
                                      <Typography className="text-xs text-stone-500">
                                        {fileTypes.map((f) => f.split('/')[1].toUpperCase()).join('/')}
                                      </Typography>
                                      <Typography className="text-xs text-stone-500">Max size: 2MB</Typography>
                                    </div>
                                  )
                                else return ''
                              },
                              label({ ready, isUploading }) {
                                if (uploadedFile)
                                  return (
                                    <Typography className="-mb-3 text-xs cursor-default text-stone-500">
                                      {uploadedFile.name}
                                    </Typography>
                                  )
                                return ''
                              },
                            }}
                            appearance={{
                              uploadIcon: 'text-stone-500 mt-2',
                              container: !uploadedFile
                                ? 'cursor-pointer border-stone-500  h-55'
                                : 'border-stone-500  h-55',
                            }}
                            endpoint="imageUploader"
                            onDrop={(files) => {
                              if (files && files[0]) {
                                setUploadedFile(files[0])
                              }
                            }}
                            onClientUploadComplete={(res) => {
                              if (res && res[0]) {
                                setImageUrl(res[0].url)
                              }
                            }}
                            onUploadError={(error: Error) => {
                              setUploadError(error.message)
                            }}
                          />
                          <Typography variant="xs" className="mt-2 text-red-500">
                            {uploadError}
                          </Typography>
                        </Tab.Panel>
                        <Tab.Panel>
                          <div className="flex flex-col items-center">
                            {generatedMeme ? (
                              <img
                                src={generatedMeme}
                                alt="Generated meme"
                                className="object-contain w-full h-auto mb-4 cursor-pointer max-h-44"
                                onClick={() => setIsDialogOpen(true)}
                              />
                            ) : (
                              <div className="flex items-center justify-center w-full mb-4 h-44 bg-stone-700">
                                <Typography variant="sm" className="text-stone-400">
                                  No meme generated yet
                                </Typography>
                              </div>
                            )}
                            <Button
                              onClick={generateMeme}
                              disabled={isGeneratingMeme}
                              variant="outlined"
                              size="xs"
                              className="w-full"
                            >
                              {isGeneratingMeme ? 'Generating...' : 'Generate Random Meme'}
                            </Button>
                          </div>
                        </Tab.Panel>
                      </Tab.Panels>
                    </Tab.Group>
                  </Form.Control>
                </div>
                <div className="flex flex-col justify-center gap-2 md:w-2/3">
                  <Form.Control label="Token Name" error={tokenNameError}>
                    <Input.TextGeneric
                      pattern="^[a-zA-Z0-9 ]{0,30}$"
                      title="Alphanumeric characters and spaces only (max 30 characters)"
                      id="token-name"
                      value={tokenName}
                      onChange={handleTokenNameChange}
                      placeholder="Enter token name"
                      error={!!tokenNameError}
                      required
                    />
                  </Form.Control>
                  <Form.Control label="Token Symbol" error={tokenSymbolError}>
                    <Input.TextGeneric
                      pattern="^[a-zA-Z0-9]{2,5}$"
                      title="Alphanumeric characters only (min 2 characters, max 5 characters)"
                      id="token-symbol"
                      value={tokenSymbol}
                      onChange={handleTokenSymbolChange}
                      error={!!tokenSymbolError}
                      placeholder="Enter token symbol"
                      required
                    />
                  </Form.Control>

                  <Form.Control label="Total Supply">
                    <Input.Numeric
                      id="total-supply"
                      value={totalSupply}
                      onUserInput={setTotalSupply}
                      placeholder="Enter total supply"
                      required
                    />
                    <div className="flex flex-col">
                      <div className="flex flex-row justify-between ">
                        <div className="flex flex-col">
                          <Typography variant="xs" className="mt-1 text-stone-400">
                            You will need {requiredHtr.toFixed(2)} HTR.
                          </Typography>
                          <Typography variant="xxs" className="mt-1 text-stone-400">
                            0.01 HTR per token.
                          </Typography>
                        </div>
                        <div className="flex flex-col">
                          <Typography variant="xs" className="mt-1 text-stone-400">
                            HTR balance: {(userHtrBalance / 100).toFixed(2)}
                          </Typography>
                          {!isEnoughBalance && (
                            <Typography variant="xxs" className="mt-1 text-red-500">
                              Insufficient balance.
                            </Typography>
                          )}
                        </div>
                      </div>
                    </div>
                  </Form.Control>
                </div>
              </div>

              <Form.Control className="mt-3" label="Token Description">
                <TextAreaInput
                  id="token-description"
                  value={tokenDescription}
                  onChange={setTokenDescription}
                  placeholder="Enter token description"
                  required
                  className="h-32"
                />
              </Form.Control>

              <Form.Section title="Social Media" description="Provide links to your social media channels">
                <Form.Control label="Telegram" error={telegramError}>
                  <Input.TextGeneric
                    id="telegram"
                    value={telegram}
                    error={!!telegramError}
                    onChange={handleTelegramChange}
                    placeholder="Enter Telegram username or link"
                    pattern="^[a-zA-Z0-9_]{5,32}$"
                    title="Alphanumeric characters and underscores only (min 5, max 32)"
                  />
                </Form.Control>
                <Form.Control label="Twitter" error={twitterError}>
                  <Input.TextGeneric
                    id="twitter"
                    value={twitter}
                    onChange={handleTwitterChange}
                    error={!!twitterError}
                    placeholder="Enter Twitter username or link"
                    pattern="^[a-zA-Z0-9_]{1,15}$"
                  />
                </Form.Control>
                <Form.Control label="Website" error={websiteError}>
                  <Input.TextGeneric
                    id="website"
                    value={website}
                    onChange={handleWebsiteChange}
                    error={!!websiteError}
                    placeholder="Enter website URL"
                    pattern="^(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+$"
                  />
                </Form.Control>
              </Form.Section>

              <Form.Buttons>
                <Checker.Connected fullWidth size="md">
                  <Button type="submit" className="w-full" disabled={!isEnoughBalance}>
                    Create Token
                  </Button>
                </Checker.Connected>
              </Form.Buttons>
            </Form>
          </div>
        </Container>
      </div>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <Dialog.Content>
          <Dialog.Header title="Generated Meme" onClose={() => setIsDialogOpen(false)} />
          {generatedMeme && (
            <img src={generatedMeme} alt="Generated meme" className="w-full h-auto max-h-[80vh] object-contain" />
          )}
        </Dialog.Content>
      </Dialog>
    </Layout>
  )
}

export default TokenCreationPage
