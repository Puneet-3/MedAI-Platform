import { jsPDF } from "jspdf";
interface Prescription {
  id: string; patientId: string; createdAt: string; prescription: string | null;
  doctor?: { name?: string | null; email?: string | null } | null;
}
export function downloadPrescription(consultation: Prescription) {
  if (!consultation.prescription) return;
  const doc = new jsPDF();
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 20;
  doc.setTextColor(41, 78, 66); doc.setFont("helvetica", "bold"); doc.setFontSize(22);
  doc.text("MedAI", margin, 25);
  doc.setTextColor(70); doc.setFontSize(12); doc.text("Consultation notes and treatment plan", margin, 37);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  const meta = [
    `Consultation: ${consultation.id}`,
    `Consultation started: ${new Date(consultation.createdAt).toLocaleDateString()}`,
    `Doctor: ${consultation.doctor?.name || "Not recorded"}`,
    `Patient ID: ${consultation.patientId}`,
  ];
  let y = 49;
  for (const item of meta) {
    const lines = doc.splitTextToSize(item, width - 2 * margin) as string[];
    doc.text(lines, margin, y); y += lines.length * 5 + 2;
  }
  doc.setDrawColor(210); doc.line(margin, y + 2, width - margin, y + 2); y += 14;
  doc.setFontSize(11); doc.setTextColor(35);
  const lines = doc.splitTextToSize(consultation.prescription, width - 2 * margin) as string[];
  for (const line of lines) {
    if (y > height - 30) { doc.addPage(); y = 25; }
    doc.text(line, margin, y); y += 6;
  }
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page++) {
    doc.setPage(page); doc.setFontSize(8); doc.setTextColor(110);
    doc.text("Exported from MedAI. This document does not include a verified digital signature.", margin, height - 15);
    doc.text(`${page} / ${total}`, width - margin, height - 15, { align: "right" });
  }
  doc.save(`MedAI-Consultation-${consultation.id.slice(0, 8)}.pdf`);
}
