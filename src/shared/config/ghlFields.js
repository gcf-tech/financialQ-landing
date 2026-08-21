// Configuración del passthrough genérico a GHL (LeadConnector).
//
// El backend reenvía `customField` tal cual a GHL: la KEY de cada entrada debe
// ser el ID interno del custom field en GHL (no su fieldKey legible), y para los
// dropdowns MULTIPLE_OPTIONS los VALUES deben ser el string EXACTO de la opción
// en GHL (no el label traducido que ve el usuario), enviados dentro de un array.
//
// Por eso cada dropdown define aquí sus values canónicos en el MISMO orden que
// las opciones de los diccionarios i18n (en/es common.json). El usuario ve el
// label (EN/ES); el form envía el value de GHL.

// ID interno de GHL por cada custom field (location 3e4KskiaytyloyjNSJhh).
// El comentario es el fieldKey de GHL, solo como referencia humana.
export const GHL_FIELD_IDS = {
  profile: 'FJtiei8XfDZIxo46YRNj',   // contact.cmo_describira_su_perfil2  (MULTIPLE_OPTIONS)
  assets: 'VYiBJdEYEDiPxbzKaQGd',    // contact.activos_invertibles_aproximados  (MULTIPLE_OPTIONS)
  income: 'YhLNC2iC76ZScHeSrYEq',    // contact.cul_es_el_ingreso_anual_de_su_hogar  (MULTIPLE_OPTIONS)
  referral: 'oJD1DdvR5GPm27DOzXFq',  // contact.cmo_conoci_a_financialq_group  (MULTIPLE_OPTIONS)
  situation: 'TEqDVNrByCTDUvazu16w', // contact.descripcion  (LARGE_TEXT, texto libre)
}

// Values canónicos de GHL por opción, en el MISMO orden que los arrays
// profileOptions / assetOptions / incomeOptions / referralOptions de i18n.
// profile/income/referral coinciden con el label en inglés (así están dadas de
// alta las opciones en GHL); assets usa el string corto configurado en GHL,
// salvo su opción de salida, que reusa la de income.
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
    // Opción de salida. Mismo string que la equivalente de `income`, a
    // propósito: es el mismo dato ("no lo digo") en dos campos distintos y el
    // CRM tiene que poder segmentarlo igual en los dos.
    'Prefer not to say',
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
