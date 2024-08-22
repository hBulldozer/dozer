import React, { useState } from 'react'
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
} from '@dozer/ui'
import TextAreaInput from '../components/TextAreaInput'
import { PhotoIcon } from '@heroicons/react/24/outline'
import { Checker, useWalletConnectClient } from '@dozer/higmi'
import { UploadDropzone } from '@dozer/api'
import { api } from '../utils/api'
import { useNetwork } from '@dozer/zustand'
import { get } from 'lodash'
import { Layout } from '../components/Layout'

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

  const { accounts } = useWalletConnectClient()
  const address = accounts.length > 0 ? accounts[0].split(':')[2] : ''
  const { network } = useNetwork()

  const LINKS = (): BreadcrumbLink[] => [
    {
      href: `/pool/create`,
      label: `Create Token`,
    },
  ]

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
  }

  // const mutation = api.getTokens.create.useMutation({
  //   onSuccess: (data) => {
  //     const hash = get(data, 'uuid') as string
  //     const notificationData: NotificationData = {
  //       type: 'swap',
  //       chainId: network,
  //       summary: {
  //         pending: `Confirming token ${tokenSymbol} creation...`,
  //         completed: `Success! Token ${tokenSymbol} created!`,
  //         failed: 'Failed summary',
  //         info: `Creating Token ${tokenSymbol}.`,
  //       },
  //       status: 'pending',
  //       txHash: hash,
  //       groupTimestamp: Math.floor(Date.now() / 1000),
  //       timestamp: Math.floor(Date.now() / 1000),
  //       promise: new Promise((resolve) => {
  //         setTimeout(resolve, 500)
  //       }),
  //       account: address,
  //     }
  //     createSuccessToast(notificationData)
  //     resetFields()
  //   },
  // })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log({
      tokenName,
      tokenSymbol,
      tokenDescription,
      telegram,
      twitter,
      website,
      imageUrl: imageSource === 'upload' ? imageUrl : generatedMeme,
    })

    // mutation.mutate({
    //   name: tokenName,
    //   symbol: tokenSymbol,
    //   description: tokenDescription,
    //   uuid: `${tokenName}-${tokenSymbol}`,
    //   createdBy: address,
    //   telegram,
    //   twitter,
    //   website,
    //   imageUrl: imageSource === 'upload' ? imageUrl : generatedMeme || '',
    // })
  }

  const generateMeme = async () => {
    setIsGeneratingMeme(true)
    try {
      const response = await fetch('https://meme-api.com/gimme/cryptocurrencymemes')
      const data = await response.json()
      setGeneratedMeme(data.url)
    } catch (error) {
      console.error('Failed to generate meme:', error)
      setUploadError('Failed to generate meme. Please try again.')
    } finally {
      setIsGeneratingMeme(false)
    }
  }

  return (
    <Layout breadcrumbs={LINKS()}>
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Typography variant="h1" className="mb-6 text-center">
          Create Your Token
        </Typography>
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
                                ? 'cursor-pointer border-stone-500 py-3 h-55'
                                : 'border-stone-500 py-3 h-55',
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
                <div className="flex flex-col justify-center gap-12 md:w-2/3">
                  <Form.Control label="Token Name">
                    <Input.TextGeneric
                      pattern="^[a-zA-Z0-9 ]{0,30}$"
                      title="Alphanumeric characters and spaces only (max 30 characters)"
                      id="token-name"
                      value={tokenName}
                      onChange={(e) => setTokenName(e)}
                      placeholder="Enter token name"
                      className="mb-3"
                      required
                    />
                  </Form.Control>
                  <Form.Control label="Token Symbol">
                    <Input.TextGeneric
                      pattern="^[a-zA-Z0-9]{2,5}$"
                      title="Alphanumeric characters only (min 2 characters, max 5 characters)"
                      id="token-symbol"
                      value={tokenSymbol}
                      onChange={(e) => setTokenSymbol(e)}
                      placeholder="Enter token symbol"
                      required
                    />
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
                <Form.Control label="Telegram">
                  <Input.TextGeneric
                    id="telegram"
                    value={telegram}
                    onChange={setTelegram}
                    placeholder="Enter Telegram username or link"
                    pattern="^[a-zA-Z0-9_]{5,32}$"
                    title="Alphanumeric characters and underscores only (min 5, max 32)"
                  />
                </Form.Control>
                <Form.Control label="Twitter">
                  <Input.TextGeneric
                    id="twitter"
                    value={twitter}
                    onChange={setTwitter}
                    placeholder="Enter Twitter username or link"
                    pattern="^[a-zA-Z0-9_]{1,15}$"
                  />
                </Form.Control>
                <Form.Control label="Website">
                  <Input.TextGeneric
                    id="website"
                    value={website}
                    onChange={setWebsite}
                    placeholder="Enter website URL"
                    pattern="^(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+$"
                  />
                </Form.Control>
              </Form.Section>

              <Form.Buttons>
                <Checker.Connected fullWidth size="md">
                  <Button type="submit" className="w-full">
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
