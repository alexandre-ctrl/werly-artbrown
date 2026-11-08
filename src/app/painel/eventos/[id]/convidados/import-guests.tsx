"use client";

import { useState, useTransition } from "react";
import Papa from "papaparse";
import { importGuestsAction } from "./actions";

type Row = {
  group?: string;
  name: string;
  age_group: "adulto" | "crianca" | "bebe";
  side: "noivo" | "noiva" | "ambos";
  phone?: string;
  email?: string;
  dietary_restrictions?: string;
  max_companions: number;
};

const TEMPLATE =
  "convite,nome,tipo,lado,telefone,email,restricoes,acompanhantes\n" +
  "Família Silva,Maria Silva,adulto,noiva,11999990000,maria@email.com,,0\n" +
  "Família Silva,João Silva,adulto,noiva,,,Sem glúten,0\n" +
  "Família Silva,Lucas Silva,criança,noiva,,,,0\n" +
  ",Carla Mendes,adulto,noivo,11988887777,,Vegetariana,1\n";

const norm = (v: unknown) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/** Descobre qual coluna da planilha corresponde a cada campo. */
function mapHeader(header: string): keyof Row | null {
  const h = norm(header);
  if (/^(convite|grupo|familia)/.test(h)) return "group";
  if (/^nome/.test(h)) return "name";
  if (/^(tipo|idade|faixa)/.test(h)) return "age_group";
  if (/^lado/.test(h)) return "side";
  if (/^(telefone|whats|celular|fone)/.test(h)) return "phone";
  if (/^e-?mail/.test(h)) return "email";
  if (/^(restri|alerg|dieta)/.test(h)) return "dietary_restrictions";
  if (/^acompanhante/.test(h)) return "max_companions";
  return null;
}

function toRows(matrix: unknown[][]): Row[] {
  const [header, ...body] = matrix;
  if (!header) return [];
  const columns = header.map((h) => mapHeader(String(h ?? "")));
  if (!columns.includes("name")) throw new Error('A planilha precisa ter uma coluna "nome".');

  return body
    .map((cells) => {
      const raw: Record<string, string> = {};
      columns.forEach((col, i) => {
        if (col) raw[col] = String(cells[i] ?? "").trim();
      });
      const age = norm(raw.age_group);
      const side = norm(raw.side);
      return {
        group: raw.group || undefined,
        name: raw.name ?? "",
        age_group: age.startsWith("crian") ? "crianca" : age.startsWith("beb") ? "bebe" : "adulto",
        side: side.includes("noiva") ? "noiva" : side.includes("noivo") ? "noivo" : "ambos",
        phone: raw.phone || undefined,
        email: raw.email || undefined,
        dietary_restrictions: raw.dietary_restrictions || undefined,
        max_companions: Math.max(0, Math.min(20, parseInt(raw.max_companions || "0", 10) || 0)),
      } satisfies Row;
    })
    .filter((r) => r.name);
}

export function ImportGuests({ eventId, onDone }: { eventId: string; onDone: () => void }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function onFile(file: File) {
    setError(null);
    setSuccess(null);
    setRows(null);
    try {
      let matrix: unknown[][];
      if (/\.xlsx$/i.test(file.name)) {
        const { readSheet } = await import("read-excel-file/browser");
        matrix = (await readSheet(file)) as unknown[][];
      } else {
        const text = await file.text();
        const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });
        matrix = parsed.data;
      }
      const result = toRows(matrix);
      if (!result.length) throw new Error("Nenhum convidado encontrado no arquivo.");
      setRows(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível ler o arquivo.");
    }
  }

  function downloadTemplate() {
    const blob = new Blob(["﻿" + TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo-convidados.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function confirmImport() {
    if (!rows) return;
    start(async () => {
      const res = await importGuestsAction(eventId, rows);
      if (res.error) setError(res.error);
      else {
        setSuccess(`${res.count} convidados importados.`);
        setRows(null);
      }
    });
  }

  const groups = rows ? new Set(rows.map((r, i) => r.group?.toLowerCase() ?? `_${i}`)).size : 0;

  return (
    <div className="card space-y-4 border-gold-200">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-2xl">Importar convidados</h3>
          <p className="text-sm text-muted">
            Arquivo CSV ou Excel (.xlsx). Linhas com o mesmo <strong>convite</strong> ficam juntas no mesmo link de RSVP.
          </p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={downloadTemplate}>Baixar modelo</button>
      </div>

      <input
        type="file"
        accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        className="block text-sm file:mr-3 file:rounded-full file:border-0 file:bg-gold-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-gold-700"
      />

      {rows && (
        <div className="space-y-3">
          <p className="text-sm">
            <strong>{rows.length}</strong> convidados em <strong>{groups}</strong> convites. Prévia:
          </p>
          <div className="max-h-64 overflow-auto rounded-lg border border-line">
            <table className="table-base">
              <thead>
                <tr><th>Convite</th><th>Nome</th><th>Tipo</th><th>Lado</th><th>Telefone</th><th>Restrições</th></tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((r, i) => (
                  <tr key={i}>
                    <td>{r.group ?? "—"}</td>
                    <td>{r.name}</td>
                    <td>{r.age_group}</td>
                    <td>{r.side}</td>
                    <td>{r.phone}</td>
                    <td>{r.dietary_restrictions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn btn-primary" onClick={confirmImport} disabled={pending}>
            {pending ? "Importando..." : "Confirmar importação"}
          </button>
        </div>
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {success}{" "}
          <button className="underline" onClick={onDone}>Fechar</button>
        </p>
      )}
    </div>
  );
}
