// Base del backend compartido (Railway, repo marca-blanca-back-v2 rama
// "financial"). Única fuente de verdad: los archivos de shared/api/ la
// importan de aquí — el protocolo es obligatorio (sin él, fetch la trata
// como ruta relativa).
export const BACKEND_URL = 'https://dashboardback.financialqgroup.com'
