"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type Currency = 'USD' | 'LKR' | 'EUR' | 'GBP' | 'INR' | 'AUD' | 'CAD'

interface CurrencyContextType {
  currency: Currency
  setCurrency: (currency: Currency) => void
  convert: (amount: number) => number
  format: (amount: number) => string
  isLoading: boolean
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  LKR: 'Rs',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  AUD: 'A$',
  CAD: 'C$'
}

// Fallback rates just in case API fails
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  LKR: 300,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.5,
  AUD: 1.5,
  CAD: 1.35
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('USD')
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load saved currency preference from localStorage
    const savedCurrency = localStorage.getItem('senyx_currency') as Currency
    if (savedCurrency && CURRENCY_SYMBOLS[savedCurrency]) {
      setCurrencyState(savedCurrency)
    }

    // Fetch real exchange rates
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(res => res.json())
      .then(data => {
        if (data && data.rates) {
          setRates(data.rates)
        }
      })
      .catch(err => console.error("Failed to fetch exchange rates, using fallbacks:", err))
      .finally(() => setIsLoading(false))
  }, [])

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency)
    localStorage.setItem('senyx_currency', newCurrency)
  }

  const convert = (amount: number) => {
    if (!amount) return 0
    const rate = rates[currency] || FALLBACK_RATES[currency] || 1
    return amount * rate
  }

  const format = (amount: number) => {
    const converted = convert(amount)
    const symbol = CURRENCY_SYMBOLS[currency] || '$'
    
    // Custom formatting for LKR and INR to handle Sri Lankan / Indian numbering system if needed, 
    // but standard locale string works well enough for general display
    const formattedNum = converted.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })
    
    return `${symbol} ${formattedNum}`
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert, format, isLoading }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}
