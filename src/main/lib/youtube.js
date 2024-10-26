/* eslint-disable prettier/prettier */
import fs from 'fs'
import ytdl from '@distube/ytdl-core'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegPath from 'ffmpeg-static'
import path from 'path'

export function conversion(opts) {
  if (!opts.url) {
    throw new Error('URL is required')
  }

  if (opts.format === 'mp3') {
    convertToMp3(opts.url, opts.bitrate)
  } else {
    convertToMp4(opts.url)
  }
}

function convertToMp3(videoUrl, bitrate) {
  console.log('Converting to MP3')
  ffmpeg.setFfmpegPath(ffmpegPath)
  const mp3FilePath = path.join(__dirname, 'audio.mp3')
  const videoStream = ytdl(videoUrl, { quality: 'highestaudio' })
  // Create a write stream for saving the MP3 to disk
  const fileWriteStream = fs.createWriteStream(mp3FilePath)
  console.log('🚀 ~ convertToMp3 ~ mp3FilePath:', mp3FilePath)

  ffmpeg(videoStream)
    .audioBitrate(bitrate ?? 128) // You can adjust the bitrate as needed
    .toFormat('mp3')
    .on('error', (err) => {
      console.error('Error during conversion:', err)
      throw new Error('Failed to convert to MP3')
    })
    .on('end', () => {
      console.log('MP3 conversion complete')
      // Optionally send success response if MP3 is saved
    })
    .pipe(fileWriteStream) // Pipe MP3 output to disk
}

function convertToMp4(videoUrl, quality = 'lowest') {
  const writeStream = fs.createWriteStream('video.mp4')
  // Set up the download stream
  const downloadStream = ytdl(videoUrl, {
    quality: quality
  })

  // Pipe the download stream to the file write stream
  downloadStream.pipe(writeStream)

  // Handle errors during the download
  downloadStream.on('error', (error) => {
    console.error('Error downloading video:', error)
    throw new Error('Failed to download video')
  })

  // When the download is finished, send a response
  writeStream.on('finish', () => {
    console.log('Video downloaded successfully')
  })

  // Handle write stream errors
  writeStream.on('error', (error) => {
    console.error('Error writing file:', error)
    throw new Error('Failed to save video')
  })
}
