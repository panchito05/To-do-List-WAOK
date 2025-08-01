# 🤖 AI-PROMPTS - Biblioteca de Prompts para Desarrollo

claude --dangerously-skip-permissions

═══════════════════════════════════════════════════════════════════════════════

### Prompt: Confirmación de Entendimiento
```
Antes de hacer cualquier cambio, explícame en términos simples:
1. ¿Qué entiendes que quiero hacer? 
2. ¿Cuál es el resultado esperado después del cambio?
3.importante no hagas ningun cambio hasta que me confirmes que entendiste lo que quiero hacer.
4. ¿Que opinas tienes alguna recomendacion o sugerencia basado en lo que entendiste hasta ahora o te parece bien hacerlo asi como te dije?

Responde de forma breve y clara para confirmar que estamos alineados.

```
═══════════════════════════════════════════════════════════════════════════════

## 🛠️ Implementación de Features

────────────────────────────────────────────────────────────────────────


### Prompt: Plan de Implementación Detallado
```
Analiza el código relacionado y explora la arquitectura actual del proyecto:

1. Identifica EXACTAMENTE qué archivos y funciones necesitan modificarse
2. Lista las dependencias entre componentes que debemos considerar
3. Crea un plan paso a paso ordenado por:
   - Cambios mínimos necesarios primero
   - Modificaciones que no rompan funcionalidad existente
   - Cada paso debe ser probado independientemente

Presenta el plan en fases claras con:
- Fase X: [Nombre descriptivo]
  - Archivo: [ruta/archivo.tsx]
  - Cambio: [descripción específica]
  - Impacto: [mínimo/medio/alto]
  - Test: [cómo verificar que funciona]
  -identifica qsi algun subagente el mejor que tu para esa tarea y si es el caso dime cual es el nombre del subagente y para que parte de la implementacion lo usaras

Recuerda: El objetivo es la SIMPLICIDAD. Si hay múltiples formas de hacerlo, elige la que requiera menos cambios, pero para eso es muy importante que ultra analices y Ultra Think el código y la planificacion.

Luego empieza la implementacion y no te detengas hasta completarlo verifica si alguno de los subagentes te puede ayudar con esas implementacion siempre y cuando sea un experto mejor que tu en esa tarea que le podrias delegar
```


═══════════════════════════════════════════════════════════════════════════════


## 🐛 Debugging y Solución de Problemas

────────────────────────────────────────────────────────────────────────


### Prompt: Clasificación de Fallas - Estructural vs Lógica
```
Analiza el problema o error en [COMPONENTE/FUNCIÓN] y clasifícalo:

1. **Identifica el tipo de falla**:
   - ESTRUCTURAL: Problemas de arquitectura, diseño, organización del código, patrones incorrectos
   - LÓGICA: Errores en algoritmos, condiciones, cálculos, flujo de datos

2. **Evidencia del problema y jamas asumas un problema sin verificarlo primero**:
   - Muestra el código problemático
   - Explica por qué falla

3. **Impacto de la falla**:
   - ¿Qué componentes afecta?
   - ¿Es un problema aislado o sistémico?
   - ¿son solo algunas lineas de codigo que solo impacta el problema?

4. **Recomendación de solución**:
   - Si es ESTRUCTURAL: ¿Requiere refactoring? ¿Cambio de patrón?
   - Si es LÓGICA: ¿Corrección simple? ¿Revisar algoritmo?

Clasifica claramente: [FALLA ESTRUCTURAL] o [FALLA DE LÓGICA] al inicio de tu respuesta.
```
═══════════════════════════════════════════════════════════════════════════════

## 🛠️ Implementación de Pruebas

────────────────────────────────────────────────────────────────────────
### Prompt: Evaluación de Necesidad de Pruebas
```
Contexto: Basado en la modificación en el código que hiciste, necesitamos evaluar el impacto, definir qué pruebas aplicar (si es que se necesitan), y generar un plan técnico claro, evitando sobreimplementaciones innecesarias.

Parte 1 - Evaluación de pruebas: Basado en la modificación, ¿qué tipo(s) de prueba debemos implementar de entre estas opciones: [Pruebas Unitarias, Integración, Regresión, Sistema, Aceptación, UI, UX, Usabilidad, Rendimiento, Carga, Estrés, Seguridad]? Para cada tipo recomendado, explica: (a) por qué es necesario, (b) qué validará exactamente, y (c) qué riesgos o fallos puede prevenir. Si no se requiere ninguna prueba, justifícalo claramente (no queremos pruebas innecesarias).

Parte 2 - Si elegiste una o varias pruebas dime el impacto técnico: Lista los archivos y funciones exactas que se ven o se verán afectadas con la implemetacion de la prueba. Indica si ya existen pruebas cubriendo esos casos, pra evitar duplicacion Menciona cualquier dependencia técnica relevante (por ejemplo, funciones reutilizadas, módulos conectados o llamadas en cascada que puedan verse impactadas).

Parte 3 - y si es inminente la implementacion crea un plan detallado de pruebas: Genera un plan detallado de pruebas:
- Tipo (s) de prueba: [describe el tipo]
- Objetivo: [¿por qué es necesario?]
- Casos de prueba: [lista los escenarios específicos]
- Ejecución: [¿cómo se ejecutarán las pruebas?]
- Validación: [¿cómo se verificarán los resultados?]
```

═══════════════════════════════════════════════════════════════════════════════

## 🔐 Seguridad

────────────────────────────────────────────────────────────────────────

### Prompt: Identificación de Vulnerabilidades de Seguridad en el Código
```
Contexto: Revisando el código que hiciste, identificamos vulnerabilidades potenciales.

Por favor, analiza el código desde una perspectiva de seguridad. Basado en el contexto, responde lo siguiente:

🧠 Parte 1 - Evaluación de Riesgos
¿Existen vulnerabilidades potenciales en esta pieza de código? Evalúa contra estas categorías clave:

- Inyección (SQL, NoSQL, LDAP, etc.)
- Exposición de datos sensibles (tokens, passwords, información personal)
- Control de acceso insuficiente (verifica roles/autenticación/autorización)
- Errores de manejo de sesión (session hijacking, tokens sin expiración)
- Validación y sanitización de inputs (formulario, headers, body, query params)
- Dependencias inseguras o sin actualizar
- Uso de funciones criptográficas débiles o mal configuradas
- Exposición accidental de rutas internas o archivos confidenciales
- Errores comunes como uso de eval(), innerHTML, exec, etc.

¿Qué tipo de ataque podría explotarlo? (ej: XSS, CSRF, RCE, SSRF, Directory Traversal, etc.)

¿Cuál sería el impacto si se explota esta vulnerabilidad? (mínimo, medio, alto, crítico)

🔧 Parte 2 - Recomendaciones Técnicas
¿Cómo se puede mitigar o eliminar la vulnerabilidad?

- Proporciona una solución concreta y segura
- Si hay varias opciones, sugiere la más segura y sencilla de implementar

¿Qué herramientas o librerías confiables pueden ayudarnos?
- Por ejemplo: Helmet.js, Bcrypt, DOMPurify, Joi, OWASP libraries, etc.

¿Deberíamos implementar pruebas de seguridad automatizadas? Si sí:
- ¿Qué tipo? (estáticas, dinámicas, fuzzing, pentest automatizado)
- ¿Con qué herramientas? (ej: Snyk, SonarQube, ZAP, CodeQL, etc.)

📋 Parte 3 - Checklist rápida de revisión segura
(Puedes responder con ✅, ⚠️ o ❌ para cada ítem)

□ ¿Se validan y sanitizan todos los inputs?
□ ¿Se protege contra inyecciones SQL/NoSQL?
□ ¿Se cifra correctamente la información sensible?
□ ¿Se evitan funciones peligrosas (eval, innerHTML, etc.)?
□ ¿La autenticación/autorización es robusta y verificada?
□ ¿Las sesiones están correctamente gestionadas (expiran, no persistentes)?
□ ¿Hay control de errores sin filtración de detalles internos?
□ ¿Se revisaron las dependencias y no hay versiones vulnerables?
```

═══════════════════════════════════════════════════════════════════════════════

*Última actualización: 2025-07-12*
*Nota: Este documento debe evolucionar con el proyecto. Agrega nuevos prompts útiles que descubras.*