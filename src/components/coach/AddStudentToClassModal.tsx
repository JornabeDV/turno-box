"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { addStudentToClassAction } from "@/actions/bookings";
import { searchStudentsAction } from "@/actions/students";

interface StudentResult {
  id: string;
  name: string | null;
  email: string;
  credits: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  classId: string;
  dateStr: string;
}

export function AddStudentToClassModal({ open, onClose, classId, dateStr }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentResult[]>([]);
  const [selected, setSelected] = useState<StudentResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!query.trim()) return;
    setIsSearching(true);
    setError(null);
    const res = await searchStudentsAction(query);
    setIsSearching(false);
    if (res.success) {
      setResults(res.data);
      setSelected(null);
    } else {
      setError(res.error ?? "Error al buscar alumnos");
    }
  }

  function handleSelect(student: StudentResult) {
    setSelected(student);
    setError(null);
  }

  function handleClose() {
    setQuery("");
    setResults([]);
    setSelected(null);
    setError(null);
    onClose();
  }

  function handleConfirm() {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const res = await addStudentToClassAction(classId, dateStr, selected.id);
      if (res.success) {
        toast.success(
          res.data?.status === "WAITLISTED"
            ? "Alumno agregado a lista de espera"
            : "Alumno agregado a la clase"
        );
        handleClose();
      } else {
        setError(res.error ?? "No se pudo agregar el alumno");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && handleClose()}
      title="Agregar alumno a la clase"
      size="md"
    >
      <div className="space-y-4 mt-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Buscar por nombre o email..."
            className="flex-1 h-12 md:h-14 rounded-[2px] bg-page border border-border px-3.5 text-sm sm:text-base text-primary placeholder:text-muted focus:outline-none focus:border-brand transition-colors"
          />
          <Button
            variant="outline"
            size="md"
            onClick={handleSearch}
            loading={isSearching}
          >
            Buscar
          </Button>
        </div>

        {results.length > 0 && !selected && (
          <div className="bg-page border border-border max-h-60 overflow-y-auto">
            {results.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelect(s)}
                className="w-full text-left px-3.5 py-3 hover:bg-panel transition-colors border-b border-border last:border-b-0"
              >
                <p className="text-sm sm:text-base text-primary">{s.name ?? "Sin nombre"}</p>
                <p className="text-xs sm:text-sm text-secondary">{s.email}</p>
                <p
                  className={`text-xs sm:text-sm mt-0.5 ${
                    s.credits > 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {s.credits} crédito{s.credits !== 1 ? "s" : ""}
                </p>
              </button>
            ))}
          </div>
        )}

        {selected && (
          <div className="bg-card border border-border p-4">
            <p className="text-sm text-primary">{selected.name ?? "Sin nombre"}</p>
            <p className="text-xs text-secondary">{selected.email}</p>
            <p
              className={`text-xs mt-1 font-medium ${
                selected.credits > 0 ? "text-success" : "text-danger"
              }`}
            >
              {selected.credits} crédito{selected.credits !== 1 ? "s" : ""} disponible
              {selected.credits !== 1 ? "s" : ""}
            </p>
            <button
              onClick={() => setSelected(null)}
              className="text-xs text-brand mt-2 hover:underline"
            >
              Cambiar alumno
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-[2px] bg-danger/10 border border-danger/20 px-3 py-2">
            <p className="text-xs md:text-sm text-danger">{error}</p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="md" className="flex-1" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant="brand"
            size="md"
            className="flex-1"
            loading={isPending}
            disabled={!selected}
            onClick={handleConfirm}
          >
            Agregar
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
