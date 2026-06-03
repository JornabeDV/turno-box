"use client";

import { Button } from "@/components/ui/Button";
import { DownloadSimple } from "@phosphor-icons/react";
import * as xlsx from "xlsx";

export function DownloadTemplateButton() {
  function handleDownload() {
    const data = [
      {
        nombre: "Juan Pérez",
        email: "juan@ejemplo.com",
        telefono: "+54 11 1234 5678",
        fecha_nacimiento: "15/03/1990",
        creditos_iniciales: 8,
      },
      {
        nombre: "María González",
        email: "maria@ejemplo.com",
        telefono: "+54 11 8765 4321",
        fecha_nacimiento: "22/07/1985",
        creditos_iniciales: 12,
      },
    ];

    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Alumnos");

    // Adjust column widths
    ws["!cols"] = [
      { wch: 20 },
      { wch: 28 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
    ];

    const buf = xlsx.write(wb, { type: "array", bookType: "xlsx" });
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_alumnos_beebox.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="md" onClick={handleDownload}>
      <DownloadSimple size={16} />
      Descargar plantilla
    </Button>
  );
}
