/**
 * Datos de identidad de la firma que el código necesita en más de un sitio.
 *
 * Hoy solo las redes oficiales. Antes vivían escritas a mano dentro de
 * `shared/ui/socialLinks/SocialLinks.jsx`, así que cambiar una URL obligaba a
 * entrar a un componente de presentación.
 *
 * OJO — duplicado consciente: `index.html` repite estas mismas URLs en el
 * `sameAs` del JSON-LD de la Organization. Es HTML estático servido tal cual,
 * no puede importar de aquí. **Al tocar una URL de este archivo, actualizar
 * también el `sameAs` de `index.html`**, o el sitio dirá una cosa a las
 * personas y otra a los buscadores.
 */

export const FIRM_SOCIAL = {
  instagram: 'https://www.instagram.com/financial.qgroup/',

  // TODO: sustituir por la página de EMPRESA de LinkedIn cuando exista.
  //
  // Esta es el perfil PERSONAL de David Enciso. Enlazarlo desde el pie de una
  // web corporativa reparte las señales de entidad entre una persona y la
  // firma en vez de consolidarlas en la firma — que es justo lo que el
  // `sameAs` del JSON-LD existe para evitar.
  //
  // No se pone una URL inventada: hasta que la página de empresa exista y
  // alguien confirme su dirección real, esta es la que hay. Ver T-006.
  linkedin: 'https://www.linkedin.com/in/david-enciso-32451b98/',
}

/**
 * Persona que la firma pone delante en las ofertas de conversación (agenda de
 * Calendly, CTA de cierre de los artículos). Vive aquí y no incrustado en el
 * copy de los diccionarios porque es un DATO de la firma, no texto traducible:
 * el nombre es el mismo en los dos idiomas y cambiarlo no debe obligar a
 * editar dos JSON de i18n y arriesgarse a que uno quede desincronizado.
 *
 * Los diccionarios llevan la frase con el marcador `{name}`; quien pinta el
 * texto lo sustituye por este valor.
 */
export const FIRM_PRINCIPAL = {
  name: 'David Enciso',
}
