'use client';

import { Button } from '@/components/ui/button';
import { jsPDF } from 'jspdf';

type DownloadFeedbackPDFProps = {
  interviewTitle: string;
  feedback: any;
};

const DownloadFeedbackPDF = ({
  interviewTitle,
  feedback,
}: DownloadFeedbackPDFProps) => {
  const handleDownloadPDF = async () => {
    const doc = new jsPDF('p', 'mm', 'a4');

    const img = new Image();
    img.src = '/pattern.png';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');

      // Add background
      doc.addImage(dataUrl, 'PNG', 0, 0, 210, 297); // A4 full page

      let y = 30;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(`Feedback on the Checkup - ${interviewTitle}`, 105, y, {
        align: 'center',
      });
      y += 12;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Overall Score: ${feedback.totalScore}/100`, 15, y);
      doc.text(new Date(feedback.createdAt).toLocaleString(), 150, y, {
        align: 'right',
      });
      y += 10;

      doc.setFont('helvetica', 'bold');
      doc.text('Final Assessment:', 15, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      const assessmentLines = doc.splitTextToSize(
        feedback.finalAssessment,
        180
      );
      doc.text(assessmentLines, 15, y);
      y += assessmentLines.length * 6;

      doc.setFont('helvetica', 'bold');
      doc.text('Breakdown:', 15, y);
      y += 10;
      doc.setFont('helvetica', 'normal');
      feedback.categoryScores.forEach((category: any, index: number) => {
        doc.text(
          `${index + 1}. ${category.name} (${category.score}/100)`,
          15,
          y
        );
        y += 6;
        const lines = doc.splitTextToSize(category.comment, 180);
        doc.text(lines, 18, y);
        y += lines.length * 6 + 2;
      });

      doc.setFont('helvetica', 'bold');
      doc.text('Strengths:', 15, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      feedback.strengths.forEach((point: string) => {
        doc.text(`• ${point}`, 18, y);
        y += 6;
      });

      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Areas for Improvement:', 15, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      feedback.areasForImprovement.forEach((point: string) => {
        const lines = doc.splitTextToSize(`• ${point}`, 180);
        doc.text(lines, 18, y);
        y += lines.length * 6;
      });

      // ✅ Footer — should be placed before final save
      y = 280;
      doc.setDrawColor(200);
      doc.setLineWidth(0.2);
      doc.line(15, y, 195, y);
      doc.setFontSize(10);
      doc.text(
        '© 2025 Alpha-Care · Built with ❤ by Team Alpha-Care',
        105,
        y + 7,
        { align: 'center' }
      );

      // ✅ Save after everything is loaded/rendered
      doc.save(`${interviewTitle.replace(/\s+/g, '_')}_Feedback.pdf`);
    };
  };

  return (
    <Button className='btn-primary' onClick={handleDownloadPDF}>
      Download PDF
    </Button>
  );
};

export default DownloadFeedbackPDF;
