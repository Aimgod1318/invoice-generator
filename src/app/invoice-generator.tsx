"use client"

import React, { useState} from 'react'
import { v4 as uuidv4 } from 'uuid'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Plus, Download } from 'lucide-react'

interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
}

interface Toast {
  id: string
  message: string
  type: 'error' | 'success'
}

export default function InvoiceGenerator() {
  const [companyName, setCompanyName] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])

  const addLineItem = () => {
    setLineItems([...lineItems, { id: uuidv4(), description: '', quantity: 0, unitPrice: 0 }])
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(lineItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id))
  }

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const tax = subtotal * 0.1 // Assuming 10% tax
    return subtotal + tax
  }

  const showToast = (message: string, type: 'error' | 'success') => {
    const id = uuidv4()
    setToasts(prevToasts => [...prevToasts, { id, message, type }])
    setTimeout(() => {
      setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id))
    }, 5000)
  }

  const validateForm = () => {
    if (!companyName.trim()) {
      showToast('Company name is required', 'error')
      return false
    }
    if (!customerName.trim()) {
      showToast('Customer name is required', 'error')
      return false
    }
    if (!invoiceNumber.trim()) {
      showToast('Invoice number is required', 'error')
      return false
    }
    if (!invoiceDate) {
      showToast('Invoice date is required', 'error')
      return false
    }
    if (lineItems.length === 0) {
      showToast('At least one item is required', 'error')
      return false
    }
    for (const item of lineItems) {
      if (!item.description.trim()) {
        showToast('All items must have a description', 'error')
        return false
      }
      if (item.quantity <= 0) {
        showToast('All items must have a quantity greater than 0', 'error')
        return false
      }
      if (item.unitPrice < 0) {
        showToast('All items must have a unit price of 0 or greater', 'error')
        return false
      }
    }
    return true
  }

  const handleDownload = () => {
    if (!validateForm()) return

    const doc = new jsPDF()

    // Add invoice header
    doc.setFontSize(20)
    doc.text('Invoice', 105, 20, { align: 'center' })
    doc.setFontSize(12)
    doc.text(`Company: ${companyName}`, 20, 40)
    doc.text(`Customer: ${customerName}`, 20, 50)
    doc.text(`Invoice Number: ${invoiceNumber}`, 20, 60)
    doc.text(`Date: ${invoiceDate}`, 20, 70)

    // Add line items
    const tableData = lineItems.map(item => [
      item.description,
      item.quantity.toString(),
      `$${item.unitPrice.toFixed(2)}`,
      `$${(item.quantity * item.unitPrice).toFixed(2)}`
    ])

    doc.autoTable({
      startY: 80,
      head: [['Description', 'Quantity', 'Unit Price', 'Total']],
      body: tableData,
    })

    // Add totals
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.text(`Subtotal: $${calculateSubtotal().toFixed(2)}`, 140, finalY)
    doc.text(`Tax (10%): $${(calculateSubtotal() * 0.1).toFixed(2)}`, 140, finalY + 10)
    doc.text(`Total: $${calculateTotal().toFixed(2)}`, 140, finalY + 20)

    // Save the PDF
    doc.save('invoice.pdf')
    showToast('Invoice generated successfully', 'success')
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Invoice Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your Company Name"
                required
              />
            </div>
            <div>
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer Name"
                required
              />
            </div>
            <div>
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="INV-001"
                required
              />
            </div>
            <div>
              <Label htmlFor="invoiceDate">Invoice Date</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Total</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Input
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                      placeholder="Item description"
                      required
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                      placeholder="Quantity"
                      min="1"
                      required
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateLineItem(item.id, 'unitPrice', Number(e.target.value))}
                      placeholder="Unit price"
                      min="0"
                      step="0.01"
                      required
                    />
                  </TableCell>
                  <TableCell>${(item.quantity * item.unitPrice).toFixed(2)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeLineItem(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Button onClick={addLineItem} className="mt-4">
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>

          <div className="mt-4 text-right">
            <p>Subtotal: ${calculateSubtotal().toFixed(2)}</p>
            <p>Tax (10%): ${(calculateSubtotal() * 0.1).toFixed(2)}</p>
            <p className="font-bold">Total: ${calculateTotal().toFixed(2)}</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" /> Generate Invoice
          </Button>
        </CardFooter>
      </Card>
      <div className="fixed top-4 right-4 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`mb-2 p-2 rounded-md text-white ${
              toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  )
}
