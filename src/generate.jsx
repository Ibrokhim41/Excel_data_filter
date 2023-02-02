import React from "react";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Generate = (qrCodeLink, fileName, date) => {
  setTimeout(() => {
    if (qrCodeLink != "") {
      const cv = document.getElementById("qrcode");
      const qrCodeImage = cv.toDataURL("image/jpeg", 1.0);
      const doc = new jsPDF();
      doc.addImage(qrCodeImage, "JPEG", 170, 5, 25, 25);
      const head = [qrCodeLink?.data?.groups?.header];
      const body = qrCodeLink?.data?.groups?.body;
      doc.setFontSize(11);
      doc.text(`Fan nomi: ${fileName}`, 15, 10);
      doc.text(
        `Guruh: ${qrCodeLink?.data?.title.replace(" cohort", "")}`,
        15,
        20
      );
      doc.text(`Sana: ${date}`, 15, 30);
      autoTable(doc, {
        theme: "grid",
        styles: { textColor: [0, 0, 0], fontStyle: "bold" },
        startY: 40,
        head: head,
        body: body,
      });
      doc.text(
        "Ma'lumotlar bazasi bo'lim boshlig'i",
        15,
        doc.lastAutoTable.finalY + 10
      );
      doc.text("A.Xoliqov", 170, doc.lastAutoTable.finalY + 10);
      doc.save(
        `${fileName} - ${qrCodeLink?.data?.title.replace(" cohort", "")}.pdf`
      );
    }
  }, 1000);

  return (
    <div>
      <QRCodeCanvas id="qrcode" value={qrCodeLink?.url} className="hidden" />
    </div>
  );
};

export default Generate;
