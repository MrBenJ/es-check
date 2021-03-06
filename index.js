#!/usr/bin/env node

'use strict'

const prog = require('caporal')
const acorn = require('acorn')
const glob = require('glob')
const fs = require('fs')
const path = require('path')

const pkg = require('./package.json')
const argsArray = process.argv

/*
  es-check 🏆
  ----
  - define the EcmaScript version to check for against a glob of JavaScript files
  - match the EcmaScript version option against a glob of files
    to to test the EcmaScript version of each file
  - error failures
*/
prog
  .version(pkg.version)
  .argument(
    '[ecmaVersion]',
    'define the EcmaScript version to check for against a glob of JavaScript files'
  ).argument(
    '[files...]',
    'a glob of files to to test the EcmaScript version against'
  ).action((args, options, logger) => {

    const configFilePath = path.resolve(process.cwd(), '.escheckrc')

    let v, files
    let config = {}

    // Check for a configuration file. If one exists, default to those options
    // if no command line arguments are passed in
    if (fs.existsSync(configFilePath)) {
      config = JSON.parse(fs.readFileSync(configFilePath))
    }

    v = args.ecmaVersion
      ? args.ecmaVersion
      : config.ecmaVersion

    files = args.files
      ? args.files
      : config.files

    if (!v) {
      logger.error(
        'No ecmaScript version passed in or found in .escheckrc. Please set your ecmaScript version in the CLI or in .escheckrc'
      )
      process.exit(1)
    }

    // define ecmaScript version
    let e = '5' // Default ecmaScript version is '5'
    switch (v) {
      case 'es3':
        e = '3'
        break
      case 'es4':
        e = '4'
        break
      case 'es5':
        e = '5'
        break
      case 'es6':
        e = '6'
        break
      case 'es7':
        e = '7'
        break
      case 'es8':
        e = '8'
        break
      case 'es2015':
        e = '6'
        break
      case 'es2016':
        e = '7'
        break
      case 'es2017':
        e = '8'
        break
      case 'es2018':
        e = '9'
        break
    }

    const errArray = []
    const globOpts = { nodir: true }
    const acornOpts = { ecmaVersion: e, silent: true }

    files.forEach((pattern) => {
      // pattern => glob or array
      const globbedFiles = glob.sync(pattern, globOpts)

      globbedFiles.forEach((file) => {
        const code = fs.readFileSync(file, 'utf8')
        try {
          acorn.parse(code, acornOpts)
        } catch (err) {
          logger.debug(`ES-Check: failed to parse file: ${file} \n - error: ${err}`)
          const errorObj = {
            err,
            stack: err.stack,
            file,
          }
          errArray.push(errorObj)
        }
      })
    })

    if (errArray.length > 0) {
      logger.error(`ES-Check: there were ${errArray.length} ES version matching errors.`)
      errArray.forEach((o) => {
        logger.info(`
          ES-Check Error:
          ----
          · erroring file: ${o.file}
          · error: ${o.err}
          · see the printed err.stack below for context
          ----\n
          ${o.stack}
        `)
      })
      process.exit(1)
    }
    logger.error(`ES-Check: there were no ES version matching errors!  🎉`)
  })

prog.parse(argsArray)
