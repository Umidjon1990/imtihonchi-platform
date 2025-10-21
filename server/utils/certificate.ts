import PDFDocument from "pdfkit";
import * as fs from "fs";
import * as path from "path";

interface CertificateData {
  studentName: string;
  testTitle: string;
  score: number;
  cefrLevel: string;
  gradedAt: Date;
  teacherName: string;
}

export async function generateCertificate(data: CertificateData): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      // Create certificates directory
      const certificatesDir = path.join(process.env.PRIVATE_OBJECT_DIR || "/tmp", "certificates");
      if (!fs.existsSync(certificatesDir)) {
        fs.mkdirSync(certificatesDir, { recursive: true });
      }

      const fileName = `certificate-${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`;
      const filePath = path.join(certificatesDir, fileName);
      const publicPath = `/api/certificates/${fileName}`;

      const writeStream = fs.createWriteStream(filePath);

      doc.pipe(writeStream);

      writeStream.on('finish', () => {
        resolve(publicPath);
      });

      writeStream.on('error', reject);

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

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
