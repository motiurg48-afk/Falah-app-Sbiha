'use client';

import { jsPDF } from 'jspdf';

export interface InvoiceItem {
  title: string;
  details?: string;
  qty: number;
  unitPrice: number;
}

export interface InvoiceData {
  orderCode: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: InvoiceItem[];
  subtotal: number;
  shippingCharge: number;
  serviceCharge?: number;
    extraCharges?: { label: string; amount: number }[];
  discount: number;
  total: number;
  paymentMethod: string;
}

const formatCurrency = (n: number) => {
  return `INR ${Math.round(n).toLocaleString('en-IN')}`;
};

export function useInvoiceGenerator() {
  const generateInvoice = (d: InvoiceData) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    // Header Design
    doc.setFillColor(18, 18, 18);
    doc.rect(0, 0, W, 32, 'F');

    doc.setFillColor(212, 175, 55); // Gold Accent Line
    doc.rect(0, 32, W, 1.5, 'F');

    // Brand Name
    doc.setTextColor(212, 175, 55);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('FALAH', 14, 18);

    doc.setTextColor(220, 220, 220);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Islamic Modest Fashion & Apparel', 14, 25);

    // Invoice Title & Info
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('INVOICE', W - 14, 16, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Order ID: #${d.orderCode}`, W - 14, 22, { align: 'right' });
    doc.text(`Date: ${d.createdAt}`, W - 14, 27, { align: 'right' });

    // Customer Information
    let y = 44;
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('BILL TO:', 14, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    y += 5;
    doc.text(`Customer Name: ${d.customerName}`, 14, y);
    y += 5;
    doc.text(`Phone: ${d.customerPhone}`, 14, y);
    y += 5;
    
    // Multi-line Address Handling
    const splitAddress = doc.splitTextToSize(`Address: ${d.customerAddress}`, W - 28);
    doc.text(splitAddress, 14, y);
    y += (splitAddress.length * 4.5);

    doc.text(`Payment Method: ${d.paymentMethod.toUpperCase()}`, 14, y);

    // Table Header
    y += 10;
    doc.setFillColor(245, 245, 245);
    doc.rect(14, y, W - 28, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Item Description', 18, y + 5.5);
    doc.text('Qty', W - 75, y + 5.5, { align: 'center' });
    doc.text('Unit Price', W - 45, y + 5.5, { align: 'right' });
    doc.text('Total', W - 18, y + 5.5, { align: 'right' });

    // Table Rows
    y += 12;
    doc.setFont('helvetica', 'normal');

    d.items.forEach((item) => {
      const itemText = item.details ? `${item.title} (${item.details})` : item.title;
      const splitTitle = doc.splitTextToSize(itemText, W - 100);
      
      doc.text(splitTitle, 18, y);
      doc.text(item.qty.toString(), W - 75, y, { align: 'center' });
      doc.text(formatCurrency(item.unitPrice), W - 45, y, { align: 'right' });
      doc.text(formatCurrency(item.qty * item.unitPrice), W - 18, y, { align: 'right' });

      y += Math.max(splitTitle.length * 5, 8);
    });

    // Summary Section Line
    doc.setDrawColor(220, 220, 220);
    doc.line(14, y, W - 14, y);

    // Summary Calculations
    y += 8;
    doc.setFontSize(9.5);

    doc.text('Subtotal:', W - 65, y);
    doc.text(formatCurrency(d.subtotal), W - 18, y, { align: 'right' });

    y += 6;
    doc.text('Delivery Fee:', W - 65, y);
    doc.text(formatCurrency(d.shippingCharge), W - 18, y, { align: 'right' });

    if (d.serviceCharge && d.serviceCharge > 0) {
      y += 6;
      doc.text('Service Charge:', W - 65, y);
      doc.text(formatCurrency(d.serviceCharge), W - 18, y, { align: 'right' });
    }

    if (d.discount > 0) {
      y += 6;
      doc.text('Discount:', W - 65, y);
      doc.text(`- ${formatCurrency(d.discount)}`, W - 18, y, { align: 'right' });
    }

    // Grand Total Box
    y += 8;
    doc.setFillColor(245, 245, 245);
    doc.rect(W - 80, y - 5, 66, 9, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(0, 0, 0);
    doc.text('Total Amount:', W - 75, y + 1);
    doc.text(formatCurrency(d.total), W - 18, y + 1, { align: 'right' });

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(120, 120, 120);
    doc.text('Thank you for shopping with FALAH!', W / 2, H - 15, { align: 'center' });
    doc.text('For support or inquiries, please contact our helpline.', W / 2, H - 10, { align: 'center' });

    // Save PDF
    doc.save(`FALAH_Invoice_${d.orderCode}.pdf`);
  };

  return { generateInvoice };
}

export function getServiceCharge(amount: number): number {
  return 0;
}

export const serviceChargeLabel = 'Service Charge';

export function buildAdminInvoice(order: any) {
  return null;
}