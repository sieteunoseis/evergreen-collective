#!/usr/bin/env node

/**
 * Generate wallpaper resolutions from source images
 *
 * Usage: node scripts/generate-resolutions.js
 *
 * This script reads all images from public/backgrounds/source/ and generates
 * the required resolution variants in public/backgrounds/
 */

import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.join(__dirname, '..')
const BACKGROUNDS_DIR = path.join(ROOT_DIR, 'public/backgrounds')
const SOURCE_DIR = path.join(BACKGROUNDS_DIR, 'source')

// Resolution configurations (width x height at 9:19.5 aspect ratio)
const RESOLUTIONS = {
  thumb: { width: 207, height: 449 },
  '1024': { width: 1024, height: 2219 },
  '1179': { width: 1179, height: 2556 },
  '1290': { width: 1290, height: 2796 },
}

// Supported input formats
const SUPPORTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp']

async function generateResolutions(sourcePath, baseName) {
  console.log(`\nProcessing: ${baseName}`)

  const image = sharp(sourcePath)
  const metadata = await image.metadata()

  console.log(`  Source: ${metadata.width}x${metadata.height}`)

  for (const [suffix, { width, height }] of Object.entries(RESOLUTIONS)) {
    const outputName = `${baseName}_${suffix}.png`
    const outputPath = path.join(BACKGROUNDS_DIR, outputName)

    await sharp(sourcePath)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
      })
      .png({ quality: 90 })
      .toFile(outputPath)

    const stats = await fs.stat(outputPath)
    const sizeKB = Math.round(stats.size / 1024)
    console.log(`  Created: ${outputName} (${width}x${height}, ${sizeKB}KB)`)
  }
}

async function main() {
  console.log('Wallpaper Resolution Generator')
  console.log('==============================')

  // Check if source directory exists
  try {
    await fs.access(SOURCE_DIR)
  } catch {
    console.log(`\nSource directory not found: ${SOURCE_DIR}`)
    console.log('Creating source directory and moving existing images...\n')

    await fs.mkdir(SOURCE_DIR, { recursive: true })

    // Move existing background images to source
    const files = await fs.readdir(BACKGROUNDS_DIR)
    const imageFiles = files.filter(f => {
      const ext = path.extname(f).toLowerCase()
      const name = f.toLowerCase()
      return SUPPORTED_EXTENSIONS.includes(ext)
        && !name.includes('_thumb')
        && !name.includes('_1024')
        && !name.includes('_1179')
        && !name.includes('_1290')
        && !name.includes('iphone-')  // Skip wireframe files
    })

    for (const file of imageFiles) {
      const src = path.join(BACKGROUNDS_DIR, file)
      const dest = path.join(SOURCE_DIR, file)
      await fs.rename(src, dest)
      console.log(`Moved: ${file} -> source/${file}`)
    }
  }

  // Read source files
  const sourceFiles = await fs.readdir(SOURCE_DIR)
  const images = sourceFiles.filter(f =>
    SUPPORTED_EXTENSIONS.includes(path.extname(f).toLowerCase())
  )

  if (images.length === 0) {
    console.log('\nNo source images found in:', SOURCE_DIR)
    console.log('Add your wallpaper source images there and run again.')
    return
  }

  console.log(`\nFound ${images.length} source images`)

  // Process each image
  for (const filename of images) {
    const sourcePath = path.join(SOURCE_DIR, filename)
    const baseName = path.parse(filename).name
    await generateResolutions(sourcePath, baseName)
  }

  console.log('\n✓ Done!')
  console.log('\nNext steps:')
  console.log('1. Update public/backgrounds/backgrounds.json with the base names')
  console.log('2. The app will automatically use _thumb for carousel and appropriate resolution for export')
}

main().catch(console.error)
