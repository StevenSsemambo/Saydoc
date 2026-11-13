// Lets Node import the app's .json knowledge files without import attributes.
import { register } from 'node:module'
register('./json-loader.mjs', import.meta.url)
