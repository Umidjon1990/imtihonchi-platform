import PDFDocument from "pdfkit";
import { Client } from "@replit/object-storage";

interface CertificateData {
  studentName: string;
  testTitle: string;
  score: number;
  cefrLevel: string;
  gradedAt: Date;
  teacherName: string;
  feedback?: string;
  transcripts?: Array<{ questionNumber: number; questionText: string; transcript: string }>;
}

const objectStorage = new Client({ bucketId: process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID });

export async function generateCertificate(data: CertificateData): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const fileName = `certificate-${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`;
      const objectKey = `.private/certificates/${fileName}`;
      const publicPath = `/api/certificates/${fileName}`;

      // Collect PDF chunks in memory
      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk) => {
        chunks.push(chunk);
      });

      doc.on('end', async () => {
        try {
          const pdfBuffer = Buffer.concat(chunks);
          await objectStorage.uploadFromBytes(objectKey, pdfBuffer);
          resolve(publicPath);
        } catch (error) {
          reject(error);
        }
      });

      doc.on('error', reject);

      // Certificate Design
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const centerX = pageWidth / 2;

      // Background border
      doc
        .rect(30, 30, pageWidth - 60, pageHeight - 60)
        .lineWidth(3)
        .stroke('#2563eb');

      doc
        .rect(40, 40, pageWidth - 80, pageHeight - 80)
        .lineWidth(1)
        .stroke('#2563eb');

      // Title
      doc
        .fontSize(40)
        .font('Helvetica-Bold')
        .fillColor('#1e40af')
        .text('SERTIFIKAT', 0, 100, { align: 'center' });

      doc
        .fontSize(16)
        .font('Helvetica')
        .fillColor('#64748b')
        .text('CEFR Og\'zaki Baholash', 0, 150, { align: 'center' });

      // Divider
      doc
        .moveTo(centerX - 150, 180)
        .lineTo(centerX + 150, 180)
        .lineWidth(2)
        .stroke('#93c5fd');

      // Student name section
      doc
        .fontSize(14)
        .font('Helvetica')
        .fillColor('#475569')
        .text('Ushbu sertifikat quyidagi talabaga beriladi:', 0, 220, { align: 'center' });

      doc
        .fontSize(32)
        .font('Helvetica-Bold')
        .fillColor('#0f172a')
        .text(data.studentName, 0, 250, { align: 'center' });

      // Test info
      doc
        .fontSize(14)
        .font('Helvetica')
        .fillColor('#475569')
        .text(`Test: ${data.testTitle}`, 0, 310, { align: 'center' });

      // Score section
      const scoreY = 360;
      const scoreBoxWidth = 200;
      const scoreBoxX = centerX - scoreBoxWidth / 2;

      doc
        .roundedRect(scoreBoxX, scoreY, scoreBoxWidth, 80, 10)
        .fillAndStroke('#eff6ff', '#2563eb');

      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .fillColor('#1e40af')
        .text('CEFR Darajasi', scoreBoxX, scoreY + 15, { width: scoreBoxWidth, align: 'center' });

      doc
        .fontSize(36)
        .font('Helvetica-Bold')
        .fillColor('#1e40af')
        .text(data.cefrLevel, scoreBoxX, scoreY + 40, { width: scoreBoxWidth, align: 'center' });

      // Score
      doc
        .fontSize(16)
        .font('Helvetica')
        .fillColor('#64748b')
        .text(`Ball: ${data.score}/100`, 0, scoreY + 100, { align: 'center' });

      // Teacher signature section
      const signatureY = pageHeight - 150;
      
      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#64748b')
        .text('O\'qituvchi:', centerX - 250, signatureY, { width: 200 });

      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#0f172a')
        .text(data.teacherName, centerX - 250, signatureY + 20, { width: 200 });

      // Line for signature
      doc
        .moveTo(centerX - 250, signatureY + 45)
        .lineTo(centerX - 50, signatureY + 45)
        .stroke('#cbd5e1');

      // Date
      doc
        .fontSize(12)
        .font('Helvetica')
        .fillColor('#64748b')
        .text('Sana:', centerX + 50, signatureY, { width: 200 });

      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#0f172a')
        .text(
          new Date(data.gradedAt).toLocaleDateString('uz-UZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          centerX + 50,
          signatureY + 20,
          { width: 200 }
        );

      doc
        .moveTo(centerX + 50, signatureY + 45)
        .lineTo(centerX + 250, signatureY + 45)
        .stroke('#cbd5e1');

      // Footer
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#94a3b8')
        .text('Imtihonchi - CEFR Og\'zaki Baholash Platformasi', 0, pageHeight - 70, { align: 'center' });

      // ============================================
      // PAGE 2: TRANSCRIPTS / TALABA GAPLARI
      // ============================================
      if (data.transcripts && data.transcripts.length > 0) {
        doc.addPage({
          size: 'A4',
          layout: 'portrait',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        const portraitPageWidth = doc.page.width;
        const portraitPageHeight = doc.page.height;
        const portraitCenterX = portraitPageWidth / 2;

        // Background border
        doc
          .rect(30, 30, portraitPageWidth - 60, portraitPageHeight - 60)
          .lineWidth(3)
          .stroke('#2563eb');

        doc
          .rect(40, 40, portraitPageWidth - 80, portraitPageHeight - 80)
          .lineWidth(1)
          .stroke('#2563eb');

        // Title
        doc
          .fontSize(28)
          .font('Helvetica-Bold')
          .fillColor('#1e40af')
          .text('TALABA GAPLARI', 0, 70, { align: 'center' });

        // Divider
        doc
          .moveTo(portraitCenterX - 100, 110)
          .lineTo(portraitCenterX + 100, 110)
          .lineWidth(2)
          .stroke('#93c5fd');

        // Student name reminder
        doc
          .fontSize(12)
          .font('Helvetica')
          .fillColor('#64748b')
          .text(`Talaba: ${data.studentName}`, 0, 130, { align: 'center' });

        let currentY = 160;

        // Render each transcript
        data.transcripts.forEach((item, index) => {
          // Check if we need a new page
          if (currentY > portraitPageHeight - 150) {
            doc.addPage({
              size: 'A4',
              layout: 'portrait',
              margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });
            currentY = 70;
          }

          // Question number and text
          doc
            .fontSize(11)
            .font('Helvetica-Bold')
            .fillColor('#1e40af')
            .text(`Savol ${item.questionNumber}:`, 70, currentY);

          currentY += 15;

          doc
            .fontSize(10)
            .font('Helvetica')
            .fillColor('#475569')
            .text(item.questionText, 70, currentY, {
              width: portraitPageWidth - 140,
              lineGap: 3
            });

          currentY += doc.heightOfString(item.questionText, {
            width: portraitPageWidth - 140,
            lineGap: 3
          }) + 10;

          // Transcript box
          const transcriptHeight = doc.heightOfString(item.transcript, {
            width: portraitPageWidth - 180,
            lineGap: 4
          });

          doc
            .roundedRect(70, currentY, portraitPageWidth - 140, transcriptHeight + 20, 5)
            .fillAndStroke('#f8fafc', '#cbd5e1');

          doc
            .fontSize(10)
            .font('Helvetica')
            .fillColor('#334155')
            .text(item.transcript, 80, currentY + 10, {
              width: portraitPageWidth - 160,
              lineGap: 4
            });

          currentY += transcriptHeight + 40;
        });

        // Footer on transcript page
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#94a3b8')
          .text('Imtihonchi - CEFR Og\'zaki Baholash Platformasi', 0, portraitPageHeight - 30, { align: 'center' });
      }

      // ============================================
      // PAGE 3: FEEDBACK / IZOHLAR
      // ============================================
      if (data.feedback && data.feedback.trim()) {
        doc.addPage({
          size: 'A4',
          layout: 'landscape',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        // Background border
        doc
          .rect(30, 30, pageWidth - 60, pageHeight - 60)
          .lineWidth(3)
          .stroke('#2563eb');

        doc
          .rect(40, 40, pageWidth - 80, pageHeight - 80)
          .lineWidth(1)
          .stroke('#2563eb');

        // Title
        doc
          .fontSize(32)
          .font('Helvetica-Bold')
          .fillColor('#1e40af')
          .text('O\'QITUVCHI IZOHLARI', 0, 80, { align: 'center' });

        // Divider
        doc
          .moveTo(centerX - 150, 130)
          .lineTo(centerX + 150, 130)
          .lineWidth(2)
          .stroke('#93c5fd');

        // Student name reminder
        doc
          .fontSize(14)
          .font('Helvetica')
          .fillColor('#64748b')
          .text(`Talaba: ${data.studentName}`, 0, 160, { align: 'center' });

        doc
          .fontSize(12)
          .font('Helvetica')
          .fillColor('#64748b')
          .text(`Test: ${data.testTitle} | CEFR: ${data.cefrLevel} | Ball: ${data.score}/100`, 0, 180, { align: 'center' });

        // Feedback box background
        const feedbackBoxY = 220;
        const feedbackBoxHeight = pageHeight - feedbackBoxY - 120;
        
        doc
          .roundedRect(70, feedbackBoxY, pageWidth - 140, feedbackBoxHeight, 10)
          .fillAndStroke('#f8fafc', '#cbd5e1');

        // Feedback text
        doc
          .fontSize(13)
          .font('Helvetica')
          .fillColor('#334155')
          .text(data.feedback, 90, feedbackBoxY + 30, {
            width: pageWidth - 180,
            align: 'left',
            lineGap: 6
          });

        // Footer on page 2
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#94a3b8')
          .text('Imtihonchi - CEFR Og\'zaki Baholash Platformasi', 0, pageHeight - 70, { align: 'center' });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
