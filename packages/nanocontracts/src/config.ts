import path from 'path'
import dotenv from 'dotenv'

// Parsing the env file.
dotenv.config({ path: path.resolve(__dirname, '.env') })

// Interface to load env variables
// Note these variables can possibly be undefined
// as someone could skip these varibales or not setup a .env file at all

interface ENV {
  LOCAL_NODE_URL: string | undefined
  PUBLIC_NODE_URL: string | undefined
  LOCAL_WALLET_MASTER_URL: string | undefined
  LOCAL_WALLET_USERS_URL: string | undefined
  WALLET_ID: string | undefined
  LPBLUEPRINT: string | undefined
}

interface Config {
  LOCAL_NODE_URL: string | undefined
  PUBLIC_NODE_URL: string | undefined
  LOCAL_WALLET_MASTER_URL: string | undefined
  LOCAL_WALLET_USERS_URL: string | undefined
  WALLET_ID: string | undefined
  LPBLUEPRINT: string | undefined
}

// Loading process.env as ENV interface

const getConfig = (): ENV => {
  return {
    LOCAL_NODE_URL: process.env.LOCAL_NODE_URL,
    PUBLIC_NODE_URL: process.env.PUBLIC_NODE_URL,
    LOCAL_WALLET_MASTER_URL: process.env.LOCAL_WALLET_MASTER_URL,
    LOCAL_WALLET_USERS_URL: process.env.LOCAL_WALLET_USERS_URL,
    WALLET_ID: process.env.WALLET_ID,
    LPBLUEPRINT: process.env.LPBLUEPRINT,
  }
}

// Throwing an Error if any field was undefined we don't
// want our app to run if it can't connect to DB and ensure
// that these fields are accessible. If all is good return
// it as Config which just removes the undefined from our type
// definition.

const getSanitzedConfig = (config: ENV): Config => {
  for (const [key, value] of Object.entries(config)) {
    if (value === undefined) {
      throw new Error(`Missing key ${key} in config.env`)
    }
  }
  return config as Config
}

const config = getConfig()

const sanitizedConfig = getSanitzedConfig(config)

export default sanitizedConfig
