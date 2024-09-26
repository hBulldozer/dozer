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
  Dots,
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
import { supabase } from '../utils/supabaseClient'
import { RealtimeChannel } from '@supabase/supabase-js'

const MEME_STORAGE_BASE_URL = 'https://supabase.dozer.finance/storage/v1/object/public/memecoins/'
const USER_UPLOADS_BUCKET = 'uploads'

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
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadChannel, setUploadChannel] = useState<RealtimeChannel | null>(null)
  const [sentTX, setSentTX] = useState(false)

  const [tokenNameError, setTokenNameError] = useState('')
  const [tokenSymbolError, setTokenSymbolError] = useState('')
  const [telegramError, setTelegramError] = useState('')
  const [twitterError, setTwitterError] = useState('')
  const [websiteError, setWebsiteError] = useState('')

  const { accounts } = useWalletConnectClient()
  const address = accounts.length > 0 ? accounts[0].split(':')[2] : ''
  const { network } = useNetwork()
  const { balance, addNotification } = useAccount()

  const { hathorRpc, rpcResult, isRpcRequestPending, reset } = useJsonRpc()

  const { data: existingTokens } = api.getTokens.all.useQuery()

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
  const validateTokenSymbol = async (value: string) => {
    if (!/^[a-zA-Z0-9]{2,5}$/.test(value)) {
      setTokenSymbolError('Alphanumeric characters only (min 2 characters, max 5 characters)')
    } else if (existingTokens && existingTokens.some((token) => token.symbol.toLowerCase() === value.toLowerCase())) {
      setTokenSymbolError('Token symbol already exists')
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
      const notificationGroup: string[] = []
      notificationGroup.push(JSON.stringify(notificationData))
      addNotification(notificationGroup)
      createSuccessToast(notificationData)
      window.location.href = `../swap/tokens?tab=custom`
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
          info: `Error creating ${tokenSymbol}.`,
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
    e.preventDefault()
    if (
      tokenNameError ||
      tokenSymbolError ||
      telegramError ||
      twitterError ||
      websiteError ||
      (!imageUrl && !generatedMeme)
    ) {
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
    } else if (
      existingTokens &&
      existingTokens.some((token) => token.symbol.toLowerCase() === tokenSymbol.toLowerCase())
    ) {
      const errorNotification: NotificationData = {
        type: 'swap',
        chainId: network,
        summary: {
          pending: `Creating token ${tokenSymbol}...`,
          completed: `Token ${tokenSymbol} creation failed`,
          failed: `Token symbol already exists.`,
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

    const token = new CustomToken(tokenSymbol, tokenName, Number(totalSupply) * 100)
    const response = await token.create(hathorRpc, address)

    console.log(response)
  }

  useEffect(() => {
    if (rpcResult?.valid && rpcResult?.result && isLoading) {
      const hash = get(rpcResult, 'result.response.hash') as string
      if (hash) {
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
          hash: hash,
          createdBy: address,
          totalSupply: parseInt(totalSupply),
        })
      }
    }
  }, [rpcResult])

  const generateMeme = async () => {
    setIsGeneratingMeme(true)
    try {
      const randomImageNumber = Math.floor(Math.random() * 79) + 1 // Random number between 1 and 79
      const imageUrl = `${MEME_STORAGE_BASE_URL}${randomImageNumber}.jpg`
      setGeneratedMeme(imageUrl)
    } catch (error) {
      console.error('Failed to generate meme:', error)
      setUploadError('Failed to generate meme. Please try again.')
    } finally {
      setIsGeneratingMeme(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)
    setUploadError('')

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${fileName}`

      // Create a channel for upload progress
      const channel = supabase.channel(`upload-${fileName}`)
      setUploadChannel(channel)

      channel
        .on('broadcast', { event: 'upload' }, (payload) => {
          if (payload.data && typeof payload.data.progress === 'number') {
            setUploadProgress(payload.data.progress)
          }
        })
        .subscribe()

      const { data, error } = await supabase.storage.from(USER_UPLOADS_BUCKET).upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

      if (error) throw error

      const { data: urlData } = supabase.storage.from(USER_UPLOADS_BUCKET).getPublicUrl(filePath)

      setImageUrl(urlData.publicUrl)
      setUploadedFile(file)
    } catch (error) {
      console.error('Error uploading file:', error)
      setUploadError('Failed to upload image. Please try again.')
    } finally {
      setIsUploading(false)
      if (uploadChannel) {
        uploadChannel.unsubscribe()
        setUploadChannel(null)
      }
    }
  }

  useEffect(() => {
    return () => {
      if (uploadChannel) {
        uploadChannel.unsubscribe()
      }
    }
  }, [uploadChannel])

  const requiredHtr = (parseInt(totalSupply) || 0) * 0.01
  const isEnoughBalance = userHtrBalance / 100 >= requiredHtr

  return (
    <Layout breadcrumbs={LINKS()}>
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Container className="flex items-center justify-center">
          <div className="max-w-4xl p-8 sm:w-full md:w-max w-max bg-stone-800 rounded-xl">
            <Form header="" className="-mt-12" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-12 md:flex-row md:items-start">
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
                        <div className="h-[220px]">
                          {' '}
                          {/* Fixed height container for both panels */}
                          {/* Upload Image Tab Panel */}
                          <Tab.Panel className="h-full">
                            <div className="flex flex-col items-center h-full">
                              <div className="flex items-center justify-center w-full mb-4 overflow-hidden h-44 bg-stone-700">
                                {uploadedFile ? (
                                  <img
                                    src={imageUrl}
                                    alt="Uploaded token image"
                                    className="object-cover w-full h-full"
                                  />
                                ) : (
                                  <PhotoIcon className="w-20 h-20 text-stone-500" />
                                )}
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    handleFileUpload(file)
                                  }
                                }}
                                className="hidden"
                                id="file-upload"
                              />
                              <Button
                                variant="outlined"
                                size="xs"
                                className="w-full mt-2"
                                onClick={() => document.getElementById('file-upload')?.click()}
                                disabled={isUploading}
                              >
                                {isUploading ? `Uploading... ${uploadProgress.toFixed(0)}%` : 'Upload Image'}
                              </Button>
                            </div>
                          </Tab.Panel>
                          {/* Generate Meme Tab Panel */}
                          <Tab.Panel className="h-full">
                            <div className="flex flex-col items-center h-full">
                              <div className="flex items-center justify-center w-full mb-4 overflow-hidden h-44 bg-stone-700">
                                {isGeneratingMeme ? (
                                  <div className="text-center">
                                    <svg
                                      className="w-10 h-10 mx-auto mb-2 text-yellow-500 animate-spin"
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                    >
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                      ></circle>
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                      ></path>
                                    </svg>
                                    <Typography variant="sm" className="text-stone-400">
                                      Getting meme...
                                    </Typography>
                                  </div>
                                ) : generatedMeme ? (
                                  <img
                                    src={generatedMeme}
                                    alt="Generated meme"
                                    className="object-cover object-center w-full h-full cursor-pointer"
                                    onClick={() => setIsDialogOpen(true)}
                                  />
                                ) : (
                                  <Typography variant="sm" className="text-stone-400">
                                    No meme generated yet
                                  </Typography>
                                )}
                              </div>
                              <Button
                                onClick={generateMeme}
                                disabled={isGeneratingMeme}
                                variant="outlined"
                                size="xs"
                                className="w-full mt-2"
                              >
                                {isGeneratingMeme ? 'Generating...' : 'Generate Random Meme'}
                              </Button>
                            </div>
                          </Tab.Panel>
                        </div>
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

              <Form.Section title="Dev Social Media" description="Provide links to your social media (optional)">
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
                {/* <Form.Control label="Website" error={websiteError}>
                  <Input.TextGeneric
                    id="website"
                    value={website}
                    onChange={handleWebsiteChange}
                    error={!!websiteError}
                    placeholder="Enter website URL"
                    pattern="^(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+$"
                  />
                </Form.Control> */}
              </Form.Section>

              <Form.Buttons>
                <div className="flex flex-col w-full gap-2">
                  <Checker.Connected fullWidth size="md">
                    {isRpcRequestPending ? (
                      <Button size="md" className="w-full" disabled>
                        <Dots>Confirm transaction in your wallet</Dots>
                      </Button>
                    ) : isLoading ? (
                      <Button size="md" className="w-full" disabled>
                        <Dots>Creating token</Dots>
                      </Button>
                    ) : (
                      <Button type="submit" size="md" className="w-full" disabled={!isEnoughBalance}>
                        Create Token
                      </Button>
                    )}
                  </Checker.Connected>
                  {isRpcRequestPending && (
                    <Button
                      size="md"
                      testdata-id="create-token-reset-button"
                      variant="outlined"
                      color="red"
                      onClick={() => {
                        reset()
                        setIsLoading(false)
                      }}
                    >
                      Cancel Transaction
                    </Button>
                  )}
                </div>
              </Form.Buttons>
            </Form>
          </div>
        </Container>
      </div>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <Dialog.Content>
          <Dialog.Header title="Generated Meme" onClose={() => setIsDialogOpen(false)} />
          {generatedMeme && (
            <div className="w-full max-h-[80vh] flex items-center justify-center overflow-hidden">
              <img src={generatedMeme} alt="Generated meme" className="object-contain max-w-full max-h-full" />
            </div>
          )}
        </Dialog.Content>
      </Dialog>
    </Layout>
  )
}

export default TokenCreationPage
