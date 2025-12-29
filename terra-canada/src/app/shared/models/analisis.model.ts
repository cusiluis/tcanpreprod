export interface AnalisisComparativoMedios {
  total_tarjetas: number;
  total_cuentas_bancarias: number;
}

export interface AnalisisTemporalPagoDia {
  fecha: string; // ISO date (YYYY-MM-DD)
  total_monto: number;
}

export interface AnalisisDistribucionEmailEstado {
  estado: string; // e.g. ENVIADO, FALLIDO, EN_COLA
  cantidad: number;
}

export interface AnalisisTopProveedor {
  proveedor: string;
  numero_pagos: number;
  total_acumulado: number;
  ultimo_pago: string; // ISO datetime string
}

export interface AnalisisCompleto {
  comparativo_medios: AnalisisComparativoMedios | null;
  temporal_pagos: AnalisisTemporalPagoDia[];
  distribucion_emails: AnalisisDistribucionEmailEstado[];
  top_proveedores: AnalisisTopProveedor[];
}

export const EMPTY_ANALISIS_COMPLETO: AnalisisCompleto = {
  comparativo_medios: null,
  temporal_pagos: [],
  distribucion_emails: [],
  top_proveedores: []
};
