'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, X, RotateCw, Check } from 'lucide-react'

interface CameraCaptureProps {
  onCapture: (imageData: string) => void
  onCancel: () => void
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Open the camera
  const openCamera = async () => {
    try {
      const constraints = { 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsCameraOpen(true)
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      alert('Unable to access camera. Please check permissions.')
    }
  }

  // Close the camera stream
  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCameraOpen(false)
    setCapturedImage(null)
  }, [])

  // Take a photo from the video stream
  const capturePhoto = () => {
    if (!videoRef.current) return
    
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
      const imageData = canvas.toDataURL('image/jpeg')
      setCapturedImage(imageData)
      closeCamera()
    }
  }

  // Retake photo
  const retakePhoto = () => {
    setCapturedImage(null)
    openCamera()
  }

  // Submit the captured photo
  const submitPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage)
    }
  }

  // Cancel the process
  const handleCancel = () => {
    closeCamera()
    onCancel()
  }

  if (!isCameraOpen && !capturedImage) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
            <Button 
              onClick={openCamera}
              className="flex items-center space-x-2"
            >
              <Camera className="w-5 h-5" />
              <span>Open Camera</span>
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (capturedImage) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4">
            <div className="relative">
              <img 
                src={capturedImage} 
                alt="Captured" 
                className="w-full rounded-md" 
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" onClick={retakePhoto}>
                <RotateCw className="w-4 h-4 mr-2" />
                Retake
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={submitPhoto}>
                <Check className="w-4 h-4 mr-2" />
                Use Photo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col space-y-4">
          <div className="relative bg-black rounded-md overflow-hidden aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={handleCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={capturePhoto}>
              <Camera className="w-4 h-4 mr-2" />
              Capture
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
