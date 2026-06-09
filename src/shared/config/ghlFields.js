// Configuración del passthrough genérico a GHL (LeadConnector).
//
// El backend reenvía `customField` tal cual: las KEYS deben ser los fieldKey
// nativos de GHL y, para los dropdowns SINGLE_OPTIONS, los VALUES deben ser el
// string EXACTO de la opción en GHL (no el label traducido que ve el usuario).
//
// Por eso cada dropdown define aquí sus values canónicos en el MISMO orden que
// las opciones de los diccionarios i18n (en/es common.json). El usuario ve el
// label (EN/ES); el form envía el value de GHL.

// fieldKey nativo de GHL por cada custom field.
export const GHL_FIELD_KEYS = {
  profile: 'cmo_describira_su_perfil',
  assets: 'activos_invertibles_aproximados',
  income: 'cul_es_el_ingreso_anual_de_su_hogar',
  referral: 'cmo_conoci_a_financialq_group',
  situation: 'descripcion', // texto libre, no dropdown
}

// Values canónicos de GHL por opción, en el MISMO orden que los arrays
// profileOptions / assetOptions / incomeOptions / referralOptions de i18n.
// profile/income/referral coinciden con el label en inglés (así están dadas de
// alta las opciones en GHL); assets usa el string corto configurado en GHL.
export const GHL_OPTION_VALUES = {
  profile: [
    'High-Income Professional',
    'Cross-Border Entrepreneur',
    'International Investor',
    'Founder with Liquidity Event',
    'Other / Prefer not to specify',
  ],
  assets: [
    '2M - 5M',
    '5M - 10M',
    '10M - 25M',
    '25M - 50M',
    '50M +',
  ],
  income: [
    'Less than $250,000',
    '$250,000 – $500,000',
    '$500,000 – $1,000,000',
    '$1,000,000 – $2,000,000',
    'More than $2,000,000',
    'Prefer not to say',
  ],
  referral: [
    'LinkedIn',
    'Referral from a client',
    'Referral from an employee',
    'Podcast',
    'Online search',
    'Event or conference',
    'Social media',
    'Other',
  ],
}
