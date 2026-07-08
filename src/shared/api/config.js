// Base del backend dedicado de la landing (repo financial-backend,
// desplegado en Dokploy). Única fuente de verdad: los archivos de
// shared/api/ la importan de aquí — el protocolo es obligatorio (sin él,
// fetch la trata como ruta relativa).
export const BACKEND_URL = 'https://financial-backend.financialqgroup.com'
