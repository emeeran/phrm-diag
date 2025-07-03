'use client'

import { useState, useEffect } from 'react'
import { MobileRecordForm } from '@/components/mobile/mobile-record-form'
import { RecordForm } from '@/components/dashboard/records/record-form'

export default function NewHealthRecordPage() {
  const [isMobile, setIsMobile] = useState(false)
  
  // Detect mobile viewport on client side
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])
  
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">New Health Record</h1>
      
      {/* Render mobile or desktop form based on screen size */}
      {isMobile ? (
        <MobileRecordForm />
      ) : (
        <RecordForm />
      )}
    </div>
  )
}
