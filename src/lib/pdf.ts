import jsPDF from 'jspdf';
import type { Prescription } from '@/types';
import { formatDate } from './utils';

export async function generatePrescriptionPDF(prescription: Prescription): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ─── Header ────────────────────────────────────────────────
  // Blue header bar
  doc.setFillColor(14, 165, 233); // sky-500
  doc.rect(0, 0, pageWidth, 35, 'F');

  // Logo text
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('WafaHealth', margin, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Telemedicine Platform | Pakistan', margin, 22);
  doc.text('www.wafahealth.pk | 0300-WAFA-123', margin, 28);

  y = 45;

  // ─── Doctor Info Box ────────────────────────────────────────
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(margin, y, contentWidth, 28, 3, 3, 'F');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Dr. ${prescription.doctorName}`, margin + 5, y + 9);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(prescription.doctorSpecialization, margin + 5, y + 16);
  doc.text(`PMDC Reg: ${prescription.doctorPmdcNumber}`, margin + 5, y + 22);

  const dateText = `Date: ${formatDate(prescription.createdAt)}`;
  doc.text(dateText, pageWidth - margin - doc.getTextWidth(dateText) - 5, y + 9);

  y += 36;

  // ─── Patient Info ──────────────────────────────────────────
  doc.setFillColor(239, 246, 255); // blue-50
  doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Patient Information', margin + 5, y + 8);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Name: ${prescription.patientName}`, margin + 5, y + 16);

  if (prescription.patientAge) {
    doc.text(`Age: ${prescription.patientAge} years`, margin + 60, y + 16);
  }
  if (prescription.patientGender) {
    doc.text(`Gender: ${prescription.patientGender}`, margin + 100, y + 16);
  }

  y += 28;

  // ─── Rx Symbol & Diagnosis ─────────────────────────────────
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(14, 165, 233);
  doc.text('Rx', margin, y + 8);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Diagnosis:', margin + 12, y + 3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const diagText = doc.splitTextToSize(prescription.diagnosis, contentWidth - 15);
  doc.text(diagText, margin + 12, y + 10);
  y += 10 + diagText.length * 5 + 8;

  // ─── Divider ───────────────────────────────────────────────
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // ─── Medicines ─────────────────────────────────────────────
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Prescribed Medicines', margin, y);
  y += 7;

  prescription.medicines.forEach((med, i) => {
    if (y > 260) {
      doc.addPage();
      y = margin;
    }

    // Medicine name
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${i + 1}. ${med.name}`, margin + 5, y);

    // Dosage details
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8);
    const details = `${med.dosage} | ${med.frequency} | For ${med.duration}${med.instructions ? ` | ${med.instructions}` : ''}`;
    doc.text(details, margin + 10, y + 6);
    y += 14;
  });

  y += 4;

  // ─── Tests ─────────────────────────────────────────────────
  if (prescription.tests && prescription.tests.length > 0) {
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Recommended Tests', margin, y);
    y += 6;

    prescription.tests.forEach((test, i) => {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`• ${test}`, margin + 5, y);
      y += 6;
    });
    y += 4;
  }

  // ─── Advice ────────────────────────────────────────────────
  if (prescription.advice) {
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text("Doctor's Advice", margin, y);
    y += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const adviceText = doc.splitTextToSize(prescription.advice, contentWidth);
    doc.text(adviceText, margin, y);
    y += adviceText.length * 5 + 4;
  }

  // ─── Follow-up ─────────────────────────────────────────────
  if (prescription.followUpDate) {
    doc.setFillColor(254, 252, 232); // yellow-50
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(161, 98, 7);
    doc.text(`Follow-up Date: ${prescription.followUpDate}`, margin + 5, y + 9);
    y += 22;
  }

  // ─── Signature ─────────────────────────────────────────────
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, margin + 50, y);
  y += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text("Doctor's Signature", margin, y);

  // ─── Footer ────────────────────────────────────────────────
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(14, 165, 233);
  doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  const footerText = 'This is a digitally generated prescription from WafaHealth. Valid only when signed by the doctor. For emergencies, call 1122.';
  doc.text(footerText, pageWidth / 2, pageHeight - 7, { align: 'center' });

  // Save
  doc.save(`Prescription_${prescription.patientName}_${new Date().toISOString().split('T')[0]}.pdf`);
}
