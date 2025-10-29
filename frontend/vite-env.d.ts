/// <reference types="vite/client" />
/// <reference types="vite/types/importMeta.d.ts" />

import { string } from "yup";

interface ImportMetaEnv {
  readonly VITE_CX_API_BASE: string;
  readonly VITE_TX_API_BASE: string;
  readonly VITE_API_BASE: string;
  readonly VITE_ADM_API_BASE: string;
  // add more env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
