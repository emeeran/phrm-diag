'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CameraCapture } from '@/components/mobile/camera-capture'
import { VoiceInput } from '@/components/mobile/voice-input'
import { useRouter } from 'next/navigation'
import { useOfflineData } from '@/hooks/use-offline'
import { InlineLoading } from '@/components/ui/loading'
import { Camera, Mic, Save, X } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

// Form schema
const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Date is required'),
})

type FormValues = z.infer<typeof formSchema>

export function MobileRecordForm() {
  const router = useRouter()
  const [showCamera, setShowCamera] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { saveItem } = useOfflineData<any>('health-records', async () => {
    // This function would typically fetch records from API
    // But for offline-first functionality, we'll handle it differently
    return []
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      date: new Date().toISOString().split('T')[0], // Today's date
    },
  })

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    
    try {
      // Create a record with a temporary ID for offline storage
      const record = {
        id: uuidv4(),
        ...values,
        images,
        createdAt: new Date().toISOString(),
      }
      
      // Save using our offline-capable function
      await saveItem(record, 'create')
      
      // Navigate back to records list
      router.push('/dashboard/records')
      router.refresh()
    } catch (error) {
      console.error('Error saving record:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle image capture
  const handleImageCapture = (imageData: string) => {
    setImages([...images, imageData])
    setShowCamera(false)
  }

  // Handle voice input
  const handleVoiceTranscript = (text: string) => {
    // Auto-fill the description field with the transcript
    form.setValue('description', text)
  }

  // Remove an image
  const removeImage = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    setImages(newImages)
  }

  if (showCamera) {
    return (
      <CameraCapture
        onCapture={handleImageCapture}
        onCancel={() => setShowCamera(false)}
      />
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Add Health Record</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter a title for this record" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="symptom">Symptom</SelectItem>
                      <SelectItem value="medication">Medication</SelectItem>
                      <SelectItem value="appointment">Appointment</SelectItem>
                      <SelectItem value="lab-result">Lab Result</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the health record"
                      className="h-32"
                      {...field} 
                    />
                  </FormControl>
                  <div className="mt-2">
                    <VoiceInput 
                      onTranscript={handleVoiceTranscript} 
                      placeholder="Record description"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Image capture section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Attached Images</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCamera(true)}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capture
                </Button>
              </div>
              
              {images.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={image} 
                        alt={`Captured ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No images attached</p>
              )}
            </div>
            
            <CardFooter className="px-0 flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <InlineLoading />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Record
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
