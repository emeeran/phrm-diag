'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Loader2 } from 'lucide-react'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  onError?: (error: string) => void
  placeholder?: string
  language?: string
  maxDuration?: number // in seconds
}

export function VoiceInput({
  onTranscript,
  onError,
  placeholder = 'Press to start speaking...',
  language = 'en-US',
  maxDuration = 30
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(true)
  const [timer, setTimer] = useState(maxDuration)
  const recognitionRef = useRef<any>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Check if speech recognition is supported
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = language
      
      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = ''
        let finalTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }
        
        const fullTranscript = finalTranscript || interimTranscript
        setTranscript(fullTranscript)
      }
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error)
        if (onError) {
          onError(`Speech recognition error: ${event.error}`)
        }
        stopListening()
      }
      
      recognitionRef.current.onend = () => {
        // Auto-stop when recognition ends
        if (isListening) {
          stopListening()
        }
      }
    } else {
      setIsSupported(false)
      if (onError) {
        onError('Speech recognition is not supported in this browser')
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [language, onError])

  // Timer countdown when listening
  useEffect(() => {
    if (isListening) {
      setTimer(maxDuration)
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            stopListening()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isListening, maxDuration])

  // Send transcript when done
  useEffect(() => {
    if (!isListening && transcript) {
      onTranscript(transcript)
    }
  }, [isListening, transcript, onTranscript])

  const startListening = () => {
    if (!recognitionRef.current) return
    
    try {
      recognitionRef.current.start()
      setIsListening(true)
      setTranscript('')
    } catch (error) {
      console.error('Failed to start speech recognition:', error)
      if (onError) {
        onError('Failed to start listening')
      }
    }
  }

  const stopListening = () => {
    if (!recognitionRef.current) return
    
    try {
      recognitionRef.current.stop()
    } catch (error) {
      console.error('Failed to stop speech recognition:', error)
    }
    
    setIsListening(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  if (!isSupported) {
    return (
      <Button 
        variant="outline" 
        className="opacity-50 cursor-not-allowed" 
        disabled
      >
        <MicOff className="h-5 w-5 mr-2" />
        Voice input not supported
      </Button>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-2">
      <Button
        type="button"
        variant={isListening ? "default" : "outline"}
        className={isListening ? "bg-red-600 hover:bg-red-700" : ""}
        onClick={toggleListening}
      >
        {isListening ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Recording... ({timer}s)
          </>
        ) : (
          <>
            <Mic className="h-5 w-5 mr-2" />
            {transcript ? 'Record again' : placeholder}
          </>
        )}
      </Button>
      
      {transcript && !isListening && (
        <div className="px-3 py-2 bg-gray-100 rounded-md text-sm w-full max-w-md">
          {transcript}
        </div>
      )}
    </div>
  )
}
