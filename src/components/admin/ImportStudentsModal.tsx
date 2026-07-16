"use client";

import { useState, useCallback } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { DownloadTemplateButton } from "./DownloadTemplateButton";
import {
  previewImportAction,
  importStudentsAction,
  type ImportPreviewRow,
  type ImportResult,
} from "@/actions/import";
import {
  UploadSimple,
  FileXls,
  CheckCircle,
  WarningCircle,
  XCircle,
  ArrowLeft,
  Spinner,
  Users,
  Envelope,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ImportStudentsModal({ open, onOpenChange }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewRow[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const reset = useCallback(() => {
    setFile(null);
    setPreview(null);
    setPreviewLoading(false);
    setImporting(false);
    setResult(null);
    setError(null);
    setDragOver(false);
  }, []);

  const handleClose = useCallback(
    (v: boolean) => {
      if (!v) reset();
      onOpenChange(v);
    },
    [onOpenChange, reset]
  );

  async function processFile(selectedFile: File) {
    setError(null);
    setFile(selectedFile);
    setPreviewLoading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    const res = await previewImportAction(formData);
    setPreviewLoading(false);

    if (!res.success) {
      setError(res.error);
      setFile(null);
      return;
    }

    setPreview(res.data);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) processFile(dropped);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) processFile(selected);
  }

  async function handleImport() {
    if (!file) return;
    setImporting(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await importStudentsAction(formData);
    setImporting(false);

    if (!res.success) {
      setError(res.error);
      return;
    }

    setResult(res.data);
  }

  const validRows = preview?.filter((r) => r.valid) ?? [];
  const invalidRows = preview?.filter((r) => !r.valid) ?? [];
  const canImport = validRows.length > 0 && invalidRows.length === 0;

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
      title={result ? "Importación completada" : importing ? "Importando alumnos" : preview ? "Revisá los datos" : "Importar alumnos"}
      description={
        result
          ? "Estos son los resultados de la importación"
          : importing
          ? "Esto puede tardar unos segundos..."
          : preview
          ? `${validRows.length} filas válidas${invalidRows.length > 0 ? ` · ${invalidRows.length} con errores` : ""}`
          : "Subí un archivo Excel o CSV con el listado de alumnos."
      }
      size="lg"
      className="sm:max-h-[85vh] flex flex-col"
    >
      <div className="flex-1 overflow-y-auto min-h-0 -mx-6 px-6">
        {/* Error general */}
        {error && (
          <div className="flex items-center gap-2 border-l-2 border-danger bg-card px-3 py-2.5 mb-4">
            <WarningCircle size={15} className="text-danger shrink-0" />
            <p className="text-xs text-danger font-[family-name:var(--font-oswald)] uppercase tracking-wide">
              {error}
            </p>
          </div>
        )}

        {/* Paso 1: Dropzone */}
        {!preview && !result && (
          <div className="space-y-5 max-md:mt-4">
            <div className="flex items-center justify-between">
              <DownloadTemplateButton />
              <p className="text-xs sm:text-sm text-muted">Máx. 500 filas · .xlsx o .csv</p>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-[2px] p-8 text-center transition-colors cursor-pointer",
                dragOver
                  ? "border-brand bg-brand/5"
                  : "border-border bg-page hover:border-secondary"
              )}
            >
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInput}
                className="hidden"
                id="import-file-input"
              />
              <label htmlFor="import-file-input" className="cursor-pointer block">
                <UploadSimple
                  size={32}
                  className={cn(
                    "mx-auto mb-3",
                    dragOver ? "text-brand" : "text-muted"
                  )}
                />
                <p className="text-sm sm:text-base text-primary font-medium">
                  Arrastrá tu archivo acá o hacé clic para seleccionarlo
                </p>
                <p className="text-xs sm:text-sm text-muted mt-1">
                  Formatos soportados: .xlsx, .csv
                </p>
              </label>
            </div>

            <div className="bg-page border border-border p-4 space-y-2">
              <p className="text-xs sm:text-sm font-medium text-secondary uppercase tracking-wider">
                Columnas esperadas
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm text-muted">
                <span>• Nombre <span className="text-danger">*</span></span>
                <span>• Email <span className="text-danger">*</span></span>
                <span>• Telefono</span>
                <span>• Fecha Nacimiento</span>
                <span>• Creditos Iniciales</span>
              </div>
            </div>
          </div>
        )}

        {/* Preview loading */}
        {previewLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Spinner size={32} className="text-brand animate-spin mb-3" />
            <p className="text-sm text-secondary">Analizando archivo...</p>
          </div>
        )}

        {/* Paso 2: Preview */}
        {preview && !result && !importing && (
          <div className="space-y-4">
            {invalidRows.length > 0 && (
              <div className="flex items-start gap-2 border-l-2 border-brand bg-card px-3 py-2.5">
                <WarningCircle size={15} className="text-brand shrink-0 mt-0.5" />
                <div className="text-xs text-brand font-[family-name:var(--font-oswald)] uppercase tracking-wide">
                  Tenés {invalidRows.length} fila{invalidRows.length !== 1 ? "s" : ""} con errores.
                  Corregí el archivo y volvé a subirlo.
                </div>
              </div>
            )}

            <div className="border border-border overflow-hidden">
              <div className="max-h-[45vh] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-page sticky top-0 z-10">
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-secondary font-medium uppercase tracking-wider w-10">
                        #
                      </th>
                      <th className="px-3 py-2 text-secondary font-medium uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-3 py-2 text-secondary font-medium uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-3 py-2 text-secondary font-medium uppercase tracking-wider hidden sm:table-cell">
                        Teléfono
                      </th>
                      <th className="px-3 py-2 text-secondary font-medium uppercase tracking-wider hidden sm:table-cell">
                        Nac.
                      </th>
                      <th className="px-3 py-2 text-secondary font-medium uppercase tracking-wider hidden sm:table-cell">
                        Créd.
                      </th>
                      <th className="px-3 py-2 text-secondary font-medium uppercase tracking-wider w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {preview.map((row) => (
                      <tr
                        key={row.rowIndex}
                        className={cn(
                          "transition-colors",
                          row.valid ? "hover:bg-white/[0.02]" : "bg-danger/5"
                        )}
                      >
                        <td className="px-3 py-2 text-muted font-mono">
                          {row.rowIndex}
                        </td>
                        <td className="px-3 py-2 text-primary">{row.nombre}</td>
                        <td className="px-3 py-2 text-primary">{row.email}</td>
                        <td className="px-3 py-2 text-secondary hidden sm:table-cell">
                          {row.telefono || "—"}
                        </td>
                        <td className="px-3 py-2 text-secondary hidden sm:table-cell">
                          {row.fechaNacimiento || "—"}
                        </td>
                        <td className="px-3 py-2 text-secondary hidden sm:table-cell">
                          {row.creditosIniciales ?? "—"}
                        </td>
                        <td className="px-3 py-2">
                          {row.valid ? (
                            <CheckCircle size={14} className="text-success" />
                          ) : (
                            <div className="group relative">
                              <XCircle size={14} className="text-danger cursor-help" />
                              <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-20 w-48 bg-page border border-border p-2 text-[10px] text-danger">
                                {row.errors.join(" ")}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Importando */}
        {importing && (
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner size={40} className="text-brand animate-spin mb-4" />
            <p className="text-sm text-secondary">Creando cuentas y enviando invitaciones...</p>
            <p className="text-xs text-muted mt-1">No cierres esta ventana</p>
          </div>
        )}

        {/* Resultado */}
        {result && (
          <div className="space-y-4 max-sm:mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-page border border-border p-4 text-center">
                <Users size={20} className="text-success mx-auto mb-1" />
                <p className="text-xl font-bold text-primary">{result.created}</p>
                <p className="text-[10px] text-secondary uppercase tracking-wider">
                  Creados
                </p>
              </div>
              <div className="bg-page border border-border p-4 text-center">
                <Users size={20} className="text-secondary mx-auto mb-1" />
                <p className="text-xl font-bold text-primary">{result.updated}</p>
                <p className="text-[10px] text-secondary uppercase tracking-wider">
                  Actualizados
                </p>
              </div>
              <div className="bg-page border border-border p-4 text-center">
                <PaperPlaneTilt size={20} className="text-brand mx-auto mb-1" />
                <p className="text-xl font-bold text-primary">{result.invited}</p>
                <p className="text-[10px] text-secondary uppercase tracking-wider">
                  Invitados
                </p>
              </div>
              <div className="bg-page border border-border p-4 text-center">
                <XCircle size={20} className="text-danger mx-auto mb-1" />
                <p className="text-xl font-bold text-primary">{result.failed}</p>
                <p className="text-[10px] text-secondary uppercase tracking-wider">
                  Errores
                </p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="border border-border overflow-hidden">
                <div className="bg-page px-3 py-2 border-b border-border">
                  <p className="text-xs text-secondary uppercase tracking-wider font-medium">
                    Errores por fila
                  </p>
                </div>
                <div className="max-h-[30vh] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <tbody className="divide-y divide-border">
                      {result.errors.map((err, i) => (
                        <tr key={i} className="hover:bg-white/[0.02]">
                          <td className="px-3 py-2 text-muted font-mono w-12">
                            {err.rowIndex}
                          </td>
                          <td className="px-3 py-2 text-primary">{err.email}</td>
                          <td className="px-3 py-2 text-danger">{err.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="shrink-0 mt-5 pt-5 border-t border-border flex items-right sm:justify-between gap-3">
        {!result && !preview && (
          <Button variant="outline" size="md" onClick={() => handleClose(false)} className="max-sm:w-full">
            Cancelar
          </Button>
        )}

        {preview && !result && !importing && (
          <>
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setPreview(null);
                setFile(null);
                setError(null);
              }}
            >
              <ArrowLeft size={14} />
              Volver
            </Button>
            <Button
              variant="brand"
              size="md"
              onClick={handleImport}
              loading={importing}
              disabled={!canImport}
            >
              <PaperPlaneTilt size={16} />
              {canImport
                ? `Importar ${validRows.length} alumno${validRows.length !== 1 ? "s" : ""}`
                : "Corregí los errores"}
            </Button>
          </>
        )}

        {result && (
          <Button variant="brand" size="md" onClick={() => handleClose(false)} fullWidth>
            Cerrar
          </Button>
        )}
      </div>
    </Dialog>
  );
}
